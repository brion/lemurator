ALL : fibonacci linear-fib

clean :
	rm -f fibonacci
	rm -f linear-fib

fibonacci : fibonacci.c
	gcc -o fibonacci -O2 -static fibonacci.c

linear-fib : linear-fib.c
	gcc -o linear-fib -O2 -static linear-fib.c
