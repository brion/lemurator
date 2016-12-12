ALL : hello fibonacci

clean :
	rm -f hello
	rm -f fibonacci

hello : hello.c
	gcc -o hello -O2 -static hello.c

fibonacci : fibonacci.c
	gcc -o fibonacci -O2 -static fibonacci.c


