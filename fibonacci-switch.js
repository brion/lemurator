var reg_eax = 0;
var reg_ebx = 0;
var reg_ecx = 0;
var reg_edx = 0;

var reg_esi = 0;
var reg_edi = 0;
var reg_ebp = 0;
var reg_eip = 0;
var reg_esp = 0;

var flag_zf = 0;

var heap = []; // quick hack. requires load/store consistency. sparse array.
var compiledBlocks = [];


function log(str) {
  //console.log(str);
}

function time(func, after) {
  var start = Date.now();
  var ret = func();
  var delta = Date.now() - start;
  after(ret, delta);
}

function cpu_loop() {
  while (true) {
    nextBlock = compiledBlocks[reg_eip];
    if (nextBlock === undefined) {
      // nextBlock = compileNextBlock
      //log('[done at ' + reg_eip.toString(16) + ']');
      return;
    }
    //log('[' + (reg_eip).toString(16) + ']');
    nextBlock();
  }
}

function run() {
  var input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 25, 30, 32];
  //var input = [5];
  for (var i = 0; i < input.length; i++) {
    var n = input[i];
    time(function() {
      return js_fibonacci(n);
    }, function(ret, delta) {
      console.log('.js for ' + n + ': ' + ret + ' (' + delta + 'ms)');
    });
    time(function() {
      return emu_fibonacci(n);
    }, function(ret, delta) {
      console.log('emu for ' + n + ': ' + ret + ' (' + delta + 'ms)');
    });
  }
}

function js_fibonacci(n) {
  if (n === 0) {
    return 0;
  } else if (n === 1) {
    return 1;
  } else {
    return js_fibonacci(n - 1) + js_fibonacci(n - 2);
  }
}

function emu_fibonacci(n) {
  // clear state
  reg_eax = reg_ebx = reg_esi = 0;
  flags_zf = 0;
  heap = [];

  reg_eip = 0x08048a30; // start of 
  reg_esp = 0x01000000; // stack position
  push32(n); // parameter
  push32(0x1234567); // fake return address
  
  cpu_loop();

  pop32(); // pop parameter

  return reg_eax;
}

function push32(val) {
  var t1, t2;
  val = val|0;
  t1 = reg_esp|0;
  t2 = (t1 - 4)|0;
  store32(t2, val);
  reg_esp = t2;
}

function pop32() {
  var t1, t2, t3;
  t1 = reg_esp|0;
  t2 = (t1 + 4)|0;
  t3 = load32(t1)|0;
  reg_esp = t2;
  return t3;
}

function store32(loc, val) {
  loc = loc|0;
  val = val|0;
  heap[loc] = val;
  // would need MMU indirection to real heap
  // and can throw
}

function load32(loc) {
  loc = loc|0;
  return heap[loc]|0;
  // would need MMU indirection to real heap
  // and can throw
}

compiledBlocks[0x08048a30] = function() {
  var t1, t2, t3, t4, t5, t6, t7, t8, t9, t10;

  for(;;) {
    switch(reg_eip|0) {
    case 0x08048a30:
    //   0x08048a30 <+0>:	push   %esi
      push32(reg_esi|0);
    //   0x08048a31 <+1>:	push   %ebx
      push32(reg_ebx|0);
    //   0x08048a32 <+2>:	sub    $0x4,%esp
      t1 = reg_esp | 0;
      t2 = 4;
      t3 = (t1 - t2) | 0;
      reg_esp = t3;
    //   0x08048a35 <+5>:	mov    0x10(%esp),%ebx
      t4 = reg_esp|0;
      t5 = 0x10;
      t6 = (t4 + t5)|0;
      t7 = load32(t6)|0;
      reg_ebx = t7;
      //log('[param is ' + reg_ebx + ']');
    //   0x08048a39 <+9>:	test   %ebx,%ebx
      t8 = reg_ebx|0;
      t9 = reg_ebx|0;
      t10 = t8 & t9; // can optimize this down
      flags_zf = (t10 === 0);
    //   0x08048a3b <+11>:	je     0x8048a83 <fibonacci+83>
      if (flags_zf) {
        reg_eip = 0x8048a83;
      } else {
        reg_eip = 0x08048a3d;
      }
      continue;

    case 0x08048a3d:
      var t1, t2, t3;
    //   0x08048a3d <+13>:	cmp    $0x1,%ebx
      t1 = 1;
      t2 = reg_ebx|0;
      t3 = t2 - t1; // check order of ops ;)
      flags_zf = (t3 === 0);
    //   0x08048a40 <+16>:	je     0x8048a87 <fibonacci+87>
      if (flags_zf) {
        reg_eip = 0x8048a87;
      } else {
        reg_eip = 0x08048a42;
      }
      continue;

    case 0x08048a42:
    //   0x08048a42 <+18>:	xor    %esi,%esi
      t1 = reg_esi|0;
      t2 = reg_esi|0;
      t3 = t1 ^ t2;
      reg_esi = t3|0; // can optimize to reg_esi = 0
    //   0x08048a44 <+20>:	jmp    0x8048a55 <fibonacci+37>
      reg_eip = 0x8048a55;
      continue;


    // no need to compile these no-ops:
    //   0x08048a46 <+22>:	lea    0x0(%esi),%esi
    //   0x08048a49 <+25>:	lea    0x0(%edi,%eiz,1),%edi

    case 0x08048a50:
      var t1, t2, t3;
    //   0x08048a50 <+32>:	cmp    $0x1,%ebx
      t1 = reg_ebx | 0;
      t2 = 1;
      t3 = (t2 - t1) | 0;
      flag_zf = (t3 === 0);
    //   0x08048a53 <+35>:	je     0x8048a78 <fibonacci+72>
      if (flag_zf) {
        reg_eip = 0x08048a78;
      } else {
        reg_eip = 0x08048a55;
      }
      continue;

    case 0x08048a55:
      var t1, t2, t3, t4, t5, t6;
    //   0x08048a55 <+37>:	lea    -0x1(%ebx),%eax
      t1 = reg_ebx|0;
      t2 = -1;
      t3 = (t1 + t2)|0;
      reg_eax = t3;
    //   0x08048a58 <+40>:	sub    $0xc,%esp
      t4 = reg_esp | 0;
      t5 = 0xc;
      t6 = (t4 - t5) | 0;
      reg_esp = t6;
    //   0x08048a5b <+43>:	push   %eax
      push32(reg_eax|0);
      //log('[calling with param ' + reg_eax + ']');
    //   0x08048a5c <+44>:	call   0x8048a30 <fibonacci>
      push32(0x8048a61);
      reg_eip = 0x8048a30;
      continue;

    case 0x08048a61:
      var t1, t2, t3, t4, t5, t6, t7, t8, t9;

    //   0x08048a61 <+49>:	add    $0x10,%esp
      t1 = reg_esp | 0;
      t2 = 0x10;
      t3 = (t1 + t2) | 0;
      reg_esp = t3;
    //   0x08048a64 <+52>:	add    %eax,%esi
      t4 = reg_esi | 0;
      t5 = reg_eax | 0;
      t6 = (t4 + t5) | 0;
      reg_esi = t6;
    //   0x08048a66 <+54>:	sub    $0x2,%ebx
      t7 = reg_ebx | 0;
      t8 = 2;
      t9 = t7 - t8;
      flags_zf = (t9 === 0);
      reg_ebx = t9;
    //   0x08048a69 <+57>:	jne    0x8048a50 <fibonacci+32>
      if (!flags_zf) {
        reg_eip = 0x8048a50;
      } else {
        reg_eip = 0x08048a6b;
      }
      continue;

    case 0x08048a6b:
    //   0x08048a6b <+59>:	add    $0x4,%esp
      t1 = reg_esp | 0;
      t2 = 4;
      t3 = (t1 + t2) | 0;
      reg_esp = t3;
    //   0x08048a6e <+62>:	mov    %esi,%eax
      reg_eax = reg_esi | 0;
    //   0x08048a70 <+64>:	pop    %ebx
      reg_ebx = pop32() | 0;
    //   0x08048a71 <+65>:	pop    %esi
      reg_esi = pop32() | 0;
    //   0x08048a72 <+66>:	ret    
      reg_eip = pop32() | 0;
      //log('[returning to ' + reg_eip.toString(16) + ' -a]');
      continue;

    // no need to compile these no-ops:
    //   0x08048a73 <+67>:	nop
    //   0x08048a74 <+68>:	lea    0x0(%esi,%eiz,1),%esi

    case 0x08048a78:
      var t1, t2, t3, t4, t5, t6;
    //   0x08048a78 <+72>:	add    $0x1,%esi
      t1 = reg_esi | 0;
      t2 = 1;
      t3 = (t1 + t2) | 0;
      reg_esi = t3;
    //   0x08048a7b <+75>:	add    $0x4,%esp
      t4 = reg_esp | 0;
      t5 = 4;
      t6 = t4 + t5;
      reg_esp = t6;
    //   0x08048a7e <+78>:	mov    %esi,%eax
      reg_eax = reg_esi | 0;
    //   0x08048a80 <+80>:	pop    %ebx
      reg_ebx = pop32() | 0;
    //   0x08048a81 <+81>:	pop    %esi
      reg_esi = pop32() | 0;
    //   0x08048a82 <+82>:	ret    
      reg_eip = pop32() | 0;
      //log('[returning to ' + reg_eip.toString(16) + ' -b]');
      continue;

    case 0x08048a83:
    //   0x08048a83 <+83>:	xor    %esi,%esi
      t1 = reg_esi | 0;
      t2 = reg_esi | 0;
      t3 = t1 ^ t2;
      reg_esi = t3; // optimize this to reg_esi = 0 :)
    //   0x08048a85 <+85>:	jmp    0x8048a6b <fibonacci+59>
      reg_eip = 0x8048a6b;
      continue;

    case 0x08048a87:
    //   0x08048a87 <+87>:	mov    $0x1,%esi
      reg_esi = 1;
    //   0x08048a8c <+92>:	jmp    0x8048a6b <fibonacci+59>
      reg_eip = 0x8048a6b;
      continue;

    default:
      return;
    }
  }
}

run();

