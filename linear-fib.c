// like fibonacci.c but in a loop instead of recursive algo

#include <stdio.h>
#include <stdlib.h>

int fibonacci(int n) {
  int a = 0;
  int b = 1;
  int result = 0;

  for (int i = 0; i <= n; i++) {
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

int main(int argc, const char **argv) {
  int n = 0;
  if (argc > 1) {
    n = atoi(argv[1]);
  }
  int val = fibonacci(n);
  printf("native for %d: %d\n", n, val);
  return 0;
}

