What it is
==========

Manually 'compiled' JS versions of disassembled C program, comparing perf
against native, the same binary running under [v86](http://copy.sh/v86/)'s
Arch Linux demo in Firefox, and the JS versions running in node.

The assembly instructions are divided up at branch boundaries similarly to how
QEMU does its dynamic translation in small translation blocks; these are then
either made each as a separate function, or combined in a loop+switch state
machine, or reconstructed into loops similarly to emscripten's "relooper"
algorithm.


Timings summary
===============

Approximate! May not be representative!

Fibonacci sequence recursive test (1x fibonacci(32)):
* x86 binary on v86: 320x slower than native
* function-per-TB: 150x slower than native
* loop+switch: 112x slower than native
* relooper: 112x slower than native

Fibonacci sequence linear test (1000x fibonacci(10000)):
* x86 binary on v86: 400x slower than native
* function-per-TB: 56x slower than native
* loop+switch: 12x slower than native
* relooper: 10x slower than native


The recursive test is dominated by function call overhead -- which includes
memory access via pushing/popping the stack -- and I'm seeing only modest
improvements versus v86, about 2-3x faster.

The linear loop test is much more amenable, with up to 40x performance gain in
the relooped version.

I can't help but feel like I'm doing something wrong in the recursive version.


Details
=======

Fibonacci native compilation running in Parallels:

```
[brion@fedora-25-x86 foo]$ time ./fibonacci 30
native for 30: 832040

real	0m0.006s
user	0m0.004s
sys	0m0.001s

[brion@fedora-25-x86 foo]$ time ./fibonacci 32
native for 32: 2178309

real	0m0.013s
user	0m0.012s
sys	0m0.000s
```


Fibonacci native compilation running on Arch Linux in v86 in Firefox:
http://copy.sh/v86/?profile=archlinux

```
root@nyu:/# time ./fibonacci 30
native for 30: 832040

real    0m1.614s
user    0m1.470s
sys     0m0.140s


root@nyu:/# time ./fibonacci 32
native for 32: 2178309

real    0m4.148s
user    0m4.027s
sys     0m0.107s
```

This shows a 320x slowdown in the v86 emulator on Firefox versus native code.


About same in Chrome, somewhat slower:

```
root@nyu:/# time ./fibonacci 30
native for 30: 832040

real    0m1.906s
user    0m1.763s
sys     0m0.143s
root@nyu:/# time ./fibonacci 32
native for 32: 2178309

real    0m4.761s
user    0m4.613s
sys     0m0.143s
```


Hand-compiled JS running in node:

fibonacci-o2.js (function per translation block)

```
.js for 30: 832040 (11ms)
emu for 30: 832040 (714ms)
.js for 32: 2178309 (31ms)
emu for 32: 2178309 (1938ms)
```

This is about a 2xish speedup versus v86, not super great.

fibonacci-switch.js (all blocks wrapped into a looped switch state machine in one function):

```
.js for 30: 832040 (11ms)
emu for 30: 832040 (555ms)
.js for 32: 2178309 (32ms)
emu for 32: 2178309 (1460ms)
```

Slight but noticeable improvement when building a switch loop in a single function.

fibonacci-relooper.js (rewritten to use a function call and if/else):

```
.js for 30: 832040 (12ms)
emu for 30: 832040 (554ms)
.js for 32: 2178309 (31ms)
emu for 32: 2178309 (1485ms)
```

About the same as without the relooping, bummer. But we have few loops here,
and mostly a lot of function call overhead. we also have both JS native func
call overhead AND the x86 ABI overhead of pushing and popping...
And I don't trust that function call mapping to be reliable and not explode.


------

Non-recursive, linear fibonacci sequence generator is much faster, naturally.
Test program runs 1000 iterations of whatever is asked of it to slow it down.
Answers will be wrong due to overflow because we also ask for a really huge
value to get the inner loop iterations up, but the calc is what's fun.


Native in parallels:

```
$ time ./linear-fib 10000
native for 10000: 1242044891

real    0m0.008s
user    0m0.007s
sys     0m0.000s
```

Arch Linux in v86 running in Firefox:

```
# time ./linear-fib 10000
native for 10000: 1242044891

real    0m3.298s
user    0m3.167s
sys     0m0.130s
```

This shows a ~400x slowdown in v86 emulator in Firefox versus native code.



linear-fib-o2.js (function per TB) runs in node nicely faster:

```
.js for 32: 2178309 (0ms)
emu for 32: 2178309 (4ms)
.js for 10000: Infinity (54ms)
emu for 10000: 1242044891 (446ms)
```

This is a ~8x speedup versus the v86 emulator, and I haven't tried relooping yet.
Not a bad start.


linear-fib-switch.js (one function for all hot TBs, with a big switch):

```
.js for 10000: Infinity (59ms)
emu for 10000: 1242044891 (99ms)
```

runs 32x faster than the v86 emulator, this is much more interesting :)
There is a lot less overhead per run of the loop, as we increment the counter and
check it and do a local jump but don't have to worry about pushing/popping and such.


linear-fib-relooper.js (one function for all hot TBs, with loop & if reconstruction)

```
.js for 10000: Infinity (57ms)
emu for 10000: 1242044891 (80ms)
```

Now about 40x faster than v86. Nice!
