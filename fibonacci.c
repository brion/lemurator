#include <stdio.h>
#include <stdlib.h>

int fibonacci(int n) {
  if (n == 0) {
    return 0;
  } else if (n == 1) {
  	return 1;
  } else {
  	return fibonacci(n - 1) + fibonacci(n - 2);
  }
}

int main(int argc, const char **argv) {
  int n = 0;
  if (argc > 1) {
    n = atoi(argv[1]);
  }
  int val = fibonacci(n);
  printf("native for %d: %d\n", n, val);
  return 0;
}

