var reg_eax = 0;
var reg_ebx = 0;
var reg_ecx = 0;
var reg_edx = 0;

var reg_esi = 0;
var reg_edi = 0;
var reg_ebp = 0;
var reg_eip = 0;
var reg_esp = 0;

var flags_zf = 0;
var flags_sf = 0;

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
  var a = 0;
  var b = 1;
  var result = 0;

  for (var i = 0; i <= n; i++) {
    if (i <= 1) {
      result = i;
    } else {
      result = a + b;
      a = b;
      b = result;
    }
  }
  return result;
}

function emu_fibonacci(n) {
  // clear state
  reg_eax = reg_ebx = reg_esi = 0;
  flags_zf = 0;
  heap = [];

  reg_eip = 0x08048b00; // start of 
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

compiledBlocks[0x08048b00] = function() {
  var t1, t2, t3, t4, t5, t6, t7;
  // 0x08048b00 <+0>:	push   %esi
  push32(reg_esi|0);
  // 0x08048b01 <+1>:	push   %ebx
  push32(reg_ebx|0);
  // 0x08048b02 <+2>:	mov    0xc(%esp),%esi
  t1 = reg_esp|0;
  t2 = 0xc;
  t3 = (t1 + t2)|0;
  t4 = load32(t3)|0;
  reg_esi = t4;
  // 0x08048b06 <+6>:	test   %esi,%esi
  t5 = reg_esi|0;
  t6 = reg_esi|0;
  t7 = t5 & t6; // can optimize this down
  flags_sf = (t7 < 0);
  // 0x08048b08 <+8>:	js     0x8048b36 <fibonacci+54>
  if (flags_sf) {
    reg_eip = 0x8048b36;
  } else {
    reg_eip = 0x08048b0a;
  }
}

compiledBlocks[0x08048b0a] = function() {
  var t1, t2, t3;
  // 0x08048b0a <+10>:	add    $0x1,%esi
  t1 = reg_esi|0;
  t2 = 1;
  t3 = (t1 + t2) | 0;
  reg_esi = t3;
  // 0x08048b0d <+13>:	xor    %edx,%edx
  reg_edx = 0; // go ahead and optimize this common pattern?
  // 0x08048b0f <+15>:	xor    %eax,%eax
  reg_eax = 0;
  // 0x08048b11 <+17>:	mov    $0x1,%ecx
  reg_ecx = 1;
  // 0x08048b16 <+22>:	xor    %ebx,%ebx
  reg_ebx = 0;
  // 0x08048b18 <+24>:	jmp    0x8048b2c <fibonacci+44>
  reg_eip = 0x8048b2c;
}

// 0x08048b1a <+26>:	lea    0x0(%esi),%esi

compiledBlocks[0x08048b20] = function() {
  var t1, t2, t3;
  // 0x08048b20 <+32>:	cmp    $0x1,%edx
  t1 = reg_edx|0;
  t2 = 1;
  t3 = t2 - t1;
  flags_zf = (t3 === 0);
  flags_sf = (t3 < 0);
  // flags_of =  ... ?
  // 0x08048b23 <+35>:	jle    0x8048b3a <fibonacci+58>
  if (flags_zf || flags_sf) {
    reg_eip = 0x8048b3a;
  } else {
    reg_eip = 0x08048b25;
  }
}

compiledBlocks[0x08048b25] = function() {
  var t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12;
  // 0x08048b25 <+37>:	lea    (%ebx,%ecx,1),%eax
  t1 = reg_ebx | 0;
  t2 = reg_ecx | 0;
  t3 = 1;
  t4 = (t1 + t2 + t3) | 0;
  reg_eax = t4;
  // 0x08048b28 <+40>:	mov    %ecx,%ebx
  t5 = reg_ecx|0;
  reg_ebx = t5;
  // 0x08048b2a <+42>:	mov    %eax,%ecx
  t6 = reg_eax|0;
  reg_ecx = t6;
  // 0x08048b2c <+44>:	add    $0x1,%edx
  t7 = reg_edx|0;
  t8 = 1;
  t9 = (t7 + t8) | 0;
  reg_edx = t9;
  // 0x08048b2f <+47>:	cmp    %esi,%edx
  t10 = reg_edx|0;
  t11 = reg_esi|0;
  t12 = t11 - t10;
  flags_zf = (t12 === 0);
  // 0x08048b31 <+49>:	jne    0x8048b20 <fibonacci+32>
  if (!flags_zf) {
    reg_eip = 0x8048b20;
  } else {
    reg_eip = 0x08048b33;
  }
}

// overlaps previous block
compiledBlocks[0x08048b2c] = function() {
  var t7, t8, t9, t10, t11, t12;
  // 0x08048b2c <+44>:	add    $0x1,%edx
  t7 = reg_edx|0;
  t8 = 1;
  t9 = (t7 + t8) | 0;
  reg_edx = t9;
  // 0x08048b2f <+47>:	cmp    %esi,%edx
  t10 = reg_edx|0;
  t11 = reg_esi|0;
  t12 = t11 - t10;
  flags_zf = (t12 === 0);
  // 0x08048b31 <+49>:	jne    0x8048b20 <fibonacci+32>
  if (!flags_zf) {
    reg_eip = 0x8048b20;
  } else {
    reg_eip = 0x08048b33;
  }
}

compiledBlocks[0x08048b33] = function() {
  // 0x08048b33 <+51>:	pop    %ebx
  reg_ebx = pop32()|0;
  // 0x08048b34 <+52>:	pop    %esi
  reg_esi = pop32()|0;
  // 0x08048b35 <+53>:	ret
  reg_eip = pop32()|0;
}

compiledBlocks[0x08048b36] = function() {
  // 0x08048b36 <+54>:	xor    %eax,%eax
  reg_eax = 0;
  // 0x08048b38 <+56>:	jmp    0x8048b33 <fibonacci+51>
  reg_eip = 0x8048b33;
}

compiledBlocks[0x08048b3a] = function() {
  var t1;
  // 0x08048b3a <+58>:	mov    %edx,%eax
  t1 = reg_edx|0;
  reg_eax = t1;
  // 0x08048b3c <+60>:	jmp    0x8048b2c <fibonacci+44>
  reg_eip = 0x8048b2c;
}

run();
