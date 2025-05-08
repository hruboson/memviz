/**
 * @file Examples for HTML frontend. Code snippets are loaded using the Example dropdown.
 * @author Ondřej Hruboš
 */

const variables_example = `// Simple variable example
/* This example shows the basic types of variables
 * you can have in a C program. */

int global = 1; // global variable - we can use this variable anywhere in the program

int main(){
	/* Variables declared inside of a scope (between { } brackets) 
	 * cannot be used outside of the scope. Advanced example of scopes
	 * can be found in the 'Scopes' example. */
	
    int integer = 42; // int can only hold integers
	double pi = 3.14f; // floating point number
    char letter = 'A'; // character value is converted to ASCII value (https://www.asciitable.com/)
	unsigned char overflow = 256; // unsigned char can only store values up to 255

	// floating points assigned to integers are rounded down
	int truncated = 2.7; 

	return 0;
}`;

const functions_example = `// Function and string example
/* This example shows how to define and call a function,
 * and how to work with string literals using pointers. */

/**
 * Defines function 'hello'
 * with parameter 'name' of type 'pointer to char' 
 * returning 'void'
 */
void hello(char* name){
	// Calls function 'printf' with argument 'name'
	printf("Hello %s", name);

	return;
}

/**
 * Defines function 'sum'
 * with parameters:
 * 		'x' of type 'int'
 * 		'y' of type 'int'
 * returning 'int'
 */
int sum(int x, int y){
	return x + y;
}

int main(){
	// Calls function 'hello' defined above with argument "world"
	hello("world");

	// Defines variable 'result'
	// Its value is the result of 
	// function 'sum' with arguments 7 and 4
	int result = sum(7, 4);

	return 0;
}`;

const scopes_example = `// Scope shadowing and visibility example
/* This example demonstrates how variable shadowing works
 * and how variables are hidden depending on the scope.
 * For this example it is recommended to use the 'Semantic'
 * visualization style. You can change this in settings. */

int a; // uninitialized global variable

void foo(int a){ // global scope is hidden
    int a = a;
	printf("%d", a); // prints value passed as an argument
}

void baz(){
    int x = a;
	printf("%d", a); // prints global a
}

int main(){
	a = 1; // initialize global a

	int a = 2; // scope of new inner a, global a is hidden
	printf("%d", a);
	
	int i; // uninitialized variable
	
	{
		int a = 3; // new scope, new a
		printf("%d", a);

		int x = 100;
		printf("%d", x);

		foo(a);
	} 

	// printf("%d", x); //<-- ERROR, x is out of scope

	// a is once again equal to 2
	printf("%d", a);

	baz();

	// int a = 2; //<-- ERROR, cannot reinitialize variable of the same name
	
	return 0;
}`;

const expressions_example = `// Expressions and operator precedence
/* This example demonstrates how expressions are evaluated and 
 * how operator precedence and associativity affect the result. */

int main(){
	int x = 10, y = 5, z = 2, a;

	a = x + y * z; 	// multiplication has higher precedence
	a = -x + y; 	// unary minus is applied first
	a += y *= z; 	// compound assignments, right to left
	a = y % 3;		// remainder operator

	a = (x+y) / (y-z); // parentheses change evaluation order

	_Bool logic = 0xF0 && 0x88; // logic operator
	int binary = 0xF0 & 0x88; 	// binary operator

	int guess;
	guess = guess + (guess = 420, 69 + (guess = 666, 20 + 30)); // comma operator

	int *ptr = &guess; // address-of operator

	return 0;
}`;

const typedef_example = `// Typedef - custom type aliases
/* This example demonstrates how to use typedef to create type aliases.
 * Aliases can make code more readable or easier to change later. */

typedef int integer; // alias for the type int
typedef unsigned char uchar; // alias for type unsigned char
typedef int* integerPtr; // alias for int*

int main(){
	
	// now we can use the aliases as types
	integer i = 42;
	uchar answer = '*';

	integerPtr ptr = &i;

	return 0;
}`;

const if_else_example = `// Conditional statements and ternary operator
/* This example demonstrates the use of if-else 
 * and the ternary operator. */

int main(){
	int number = 9;

	if(number % 2 == 0){
		printf("Even");
	}else{
		printf("Odd");
	}

	// Same check but using the tertiary operator
	char isEven = number % 2 == 0 ? 'Y' : 'N';

	return 0;
}`;

const for_loop_example = `// Simple for loop
/* Adds numbers from 1 to 10 using a loop. Demonstrates 
 * summation of an arithmetic series: 1 + 2 + ... + 10. */

int main(){
    int result = 0;
    
	// Basic for loop
    for(int i = 1; i <= 10; i++){
        result += i;
    }
    
    return 0;
}`;

const for_loop_advanced_example = `// Advanced for loop example
/* This example demonstrates a nested loop pattern that prints
 * an 'X' border with empty space in the center. The outer loop
 * controls rows, while the inner loop controls columns. */

int main(){
	for(int x = 0; x < 5; x++){ // outer loop
    	for(int y = 0; y < 5; y++){ // inner loop
    	    if((y < 1 || y > 3) || (x < 1 || x > 3)){ // check border
    		    printf("X");
    	    }else{
    	        printf(" ");
    	    }
    	}

    	printf("\\n");
	}

	return 0;
}`;

const while_loop_example = `// While loop example
/* This example demonstrates a nested while loop. This
 * example does the exact same thing the for loop example
 * does. It shows that every for loop can be written as 
 * while loop. */

int main(){
	int x = 0;
	while(x < 5){ // outer loop
		int y = 0;
		while(y < 5){ // inner loop
			if((y < 1 || y > 3) || (x < 1 || x > 3)){ // check border
				printf("X");
			}else{
				printf(" ");
			}
			y++;
		}

		printf("\\n");
		x++;
	}

	return 0;
}`;

const do_while_loop_example = `// Do-while loop example
/* This example calculates powers of 2 starting from 1 (2^0),
 * and continues multiplying by 2 until the value exceeds 1000. */

int main(){
	int number = 1;
	
	// do block runs always at least once
	do{ 
		printf("%d\\n", number);
		number *= 2;
	}while(number <= 1000); // condition is checked at the end of do block

	/*
	 * Notice, at the end of the loop the value of 'number' is 1024
	 */

	return 0;
}`;

const switch_example = `// Switch statement for basic arithmetic operations
/* Demonstrates use of switch-case for evaluating 
 * a character-based operation on two integers. */

int main(){
	int a = 21, b = 3;
	char operand = '+'; // can be +, -, *, /, %
	int result;

	switch(operand){
		case '+':
			result = a + b;
			break;
		case '-':
			result = a - b;
			break;
		case '*':
			result = a * b;
			break;
		case '/':
			result = a / b;
			break;
		case '%':
			result = a % b;
			break;
		default:
			return 1; // error - unknown operator
	}

	return 0;
}`;

const pointers_example = `// Pointer example using the swap function
/* Demonstrates use of pointers to manipulate 
 * and exchange variable values directly in memory. */

void swap(int *a, int *b){
	int temp = *a; 	// dereference to get value
	*a = *b; 		// assign value pointed to by b to symbol pointed to by a
	*b = temp;		// assign original a to symbol pointed to by b
}

int main(){
	int x = 5;
	int y = 10;

	// Swap value of x and y using their addresses
	swap(&x, &y);

	return 0;
}`;

const array_example = `// Arrays and pointers
/* This example shows how to work with arrays and pointers.
 * It demonstrates how to access elements using indexing and how
 * pointer arithmetic can be used as an alternative. */

int main(){
	int a[3] = { 0, 1, 2 }; 				// array of size 3
	int aSize = sizeof(a) / sizeof(a[0]); 	// sizeof operator
	int i = a[0]; 							// first element is on index 0
	
	int* ptr = &a[1]; 	// pointer pointing to the middle of the array
	int* ptr2 = a+1; 	// same pointer using pointer arithmetic

	// filling array using for loop
	int arr[5];
	for(int i = 0; i < 5; i++){
		arr[i] = i;
	}

	return 0;
}`;

const strings_example = `// String storage and pointer manipulation
/* This example demonstrates different ways to store strings in memory
 * and how to work with pointers to access string elements. */

int main(){
	char* strPtr = "Hi!"; 		// string allocated in data segment 
	char strArray[] = "Hi!"; 	// string allocated on stack
 
	/* strings allocated in data segment 
	   but array of pointers allocated on stack */
	char* alph[3] = {
		"ABC",
		"DEF",
		"GHI"
	};

	char** middle = &alph[1]; // pointer to middle of alph
 
	return 0;
}`;

const type_sizes_example = `// Variable types and memory layout demonstration
/* This example shows memory addresses of variables of different types
 * and their sizes in bytes. It demonstrates how various data types
 * are allocated in memory and their typical storage sizes. 
 * Note that on different architecture the sizes can vary. */

/* For this example turn on 'Show true sizes' in settings */

int main() {
    _Bool b = 1; 				// size 1 byte

	char c = 2; 				// size 1 byte
	unsigned char uc = 3; 		// size 1 byte

	short s = 4; 				// size 2 bytes
	unsigned short us = 5;		// size 2 bytes

	int i = 6;					// size 4 bytes
	unsigned int ui = 7;		// size 4 bytes

	long l = 8;					// size 4 bytes
	unsigned long ul = 9;		// size 4 bytes
	long long ll = 10;			// size 8 bytes
	unsigned long long ull = 11;// size 8 bytes

	float f = 3.14;				// size 4 bytes
	double d = 1.414;			// size 8 bytes
	long double ld = 6.28318;	// size 8 bytes (or 16 depending on architecture)

    return 0;
}`;

const pointer_arithmetic_example = `// Pointer arithmetic and address printing
/* This example prints memory addresses of variables and shows
 * how pointer arithmetic can be used to access adjacent values.
 * It demonstrates how arrays and variables are laid out in memory. */

int main(){
	int q = 10;
	int s = 5;

	int* p = &q;      // pointer to variable q
	int a[3];         // uninitialized array of 3 integers

	// Prints addresses of array elements
	printf("%p\\n",    a);       // address of a[0]
	printf("%p\\n", &a[1]);      // address of a[1]
	printf("%p\\n", &a[2]);      // address of a[2]

	// Prints addresses of variables
	printf("%p\\n",    &q);      // address of q
	printf("%p\\n",    p);       // same as &q
	printf("%p\\n",    &s);      // address of s

	// Accessing values directly and via pointer arithmetic
	int value = s;              // direct value access
	int pvalue = *(p-1);      	// access to s using pointer arithmetic (depends on implementation)

	return 0;
}`;

const malloc_example = `// Memory allocation without freeing (memory leak)
/* Demonstrates dynamic memory allocation using malloc without
 * proper deallocation, resulting in a memory leak. */

int main() {
    int* ptr = (int*) malloc(sizeof(int)); // allocate memory and cast pointer to int pointer
    if(ptr == NULL){
        return 1;
    }

    *ptr = 42; // assign value to allocated memory
    printf("%d", *ptr);

    // No call to free(ptr) — memory leak

    return 0;
}`;

const free_example = `// Proper memory allocation and deallocation
/* Demonstrates dynamic memory allocation using malloc and 
 * proper cleanup using free to avoid memory leaks. */

int main() {
    int* ptr = (int*) malloc(sizeof(int)); // allocate memory for one int
    if(ptr == NULL){
        return 1;
    }

    *ptr = 42; // assign value to allocated memory
    printf("%d", *ptr);

    free(ptr); // free allocated memory

    return 0;
}`;

const multidimensional_arrays_example = `// 2D arrays (matrices)
/* This example shows how to declare and manipulate a 2D array (matrix),
 * use pointers to access its data, and how to modify specific rows and columns. */

int main() {
	// 3x3 matrix
    int matrix[3][3] = {
        {00, 01, 02},
        {10, 11, 12},
        {20, 21, 22}
    };
    
    int *ptr  = &matrix[0][0]; 	// pointer to first element
	int *ptr2 = matrix; 		// same pointer
    
    matrix[1][1] = 99;  // direct access to element in the middle
    
    // Set last column of each row to 0
    for(int i = 0; i < 3; i++){
        matrix[i][2] = 0; 
    }
    
    // Set all elements of last row to -1
    for(int j = 0; j < 3; j++){
        matrix[2][j] = -1;
    }
    
    return 0;
}`;

const pointer_arrays_example = `// Arrays of pointers
/* This example demonstrates how to store addresses in an array of pointers
 * and modify the values of multiple variables through indirect access. */

int main(){
    int x = 10;
    int y = 20;
    int z = 30;
    
    int *ptr_arr[3]; // array of integer pointers
    
    // Assign addresses to pointer array
    ptr_arr[0] = &x;  // first element points to x
    ptr_arr[1] = &y;  // second points to y
    ptr_arr[2] = &z;  // third points to z
    
    // Modify values through pointers
    for(int i = 0; i < 3; i++){
        *ptr_arr[i] *= 2; // multiply each value by 2
    }
    
    return 0;
}`;

const array_search_example = `// Search in an array (linear) 
/* This example shows how to search for a specific value
 * in a simple integer array using a linear search algorithm.
 * For more advanced algorithm see 'Binary search' example. */

int main(){
    int numbers[] = {10, 33, 11, 111, 256, 42, 123}; // simple array of numbers
	int length = sizeof(numbers) / sizeof(int);
    int search_for = 42; // number to find
    int found = -1;      // flag if found
    
    // Basic linear search
    for(int i = 0; i < length; i++){
        if(numbers[i] == search_for){
            found = 0;  // set flag if found
            break;      // exit loop early
        }
    }
    
    return found;  // returns 0 if found, -1 if not
}`;

const string_reversal_example = `// String reversal
/* This example demonstrates how to calculate the length of a string
 * and then reverse it in place by swapping characters using a loop. */

int main() {
    char str[] = "hello";
    int length = 0;
    
    // Calculate string length
    while (str[length] != '\\0') {
        length++;
    }
    
    // Reverse the string by swapping characters
    for (int i = 0, j = length - 1; i < j; i++, j--) { // two variables: i,j
        // Swap characters at positions i and j
        char temp = str[i];
        str[i] = str[j];
        str[j] = temp;
    }
    
    return 0;
}`;

const advanced_malloc = `// Advanced malloc example
/* This example demonstrates how to dynamically allocate memory for an array,
 * initialize its values, and properly free the allocated memory when done. */

int* createArrayOfIntegers(int size){
	int* ptr = malloc(sizeof(int)*size);
	if (ptr == 0) {
		return 1;
	}

	// assign values to each address allocated
	for(int i = 0; i < size; i++){
		*(ptr+i) = (i+1)*10;
	}
    
	return ptr; // pass pointer to main function
}

int main() {
	int size = 5;
    int* arr = createArrayOfIntegers(size);
    
    printf("%d", arr[size-1]);

    // free allocated memory
    free(arr);

    return 0;
}`;

const min_max_example = `// Finds min and max of integer array
/* Demonstrates how to find the minimum and maximum values
 * in a static integer array using a simple linear scan. */

int main() {
    int array[] = {10, 152, 300, -11, -150, 42, 188};
    int size = sizeof(array) / sizeof(array[0]);
    
    int min = array[0];
    int max = array[0];

    for(int i = 1; i < size; i++){
        if(array[i] < min){
            min = array[i];
        }
        if(array[i] > max){
            max = array[i];
        }
    }

    return 0;
}`;

const array_average_example = `// Average of integer array
/* Demonstrates how to compute the average value
 * of a static integer array using simple iteration
 * and type conversion for floating-point result. */

int main() {
    int numbers[] = {1, 2, 3, 4, 5, 6};
    int sum = 0;
    int size = sizeof(numbers) / sizeof(numbers[0]);

    for(int i = 0; i < size; i++){
        sum += numbers[i];
    }

    float average = (float)sum / size;
    
    return 0;
}`;

const recursive_factorial_example = `// Calculates factorial using recursion
/* Demonstrates basic recursion by breaking down
 * factorial problem into smaller subproblems
 * until reaching base case (1! = 1) */

// Recursive function to calculate factorial
int factorial(int n){
    if(n <= 1) return 1;

	n = n * factorial(n-1);
	return n;
}

int main(){
    int result = factorial(5);

    return 0;
}`;

const ackermann_example = `// Ackermann function example
/* Demonstrates a recursive implementation of the Ackermann function,
 * a well-known example of a function that is not primitive recursive
 * and grows very rapidly even for small inputs. 
 * See more at https://en.wikipedia.org/wiki/Ackermann_function */

int ackermann(int m, int n){
    if(m == 0){
        return n + 1;
    }else if((m > 0) && (n == 0)){
        return ackermann(m - 1, 1);
    }else if((m > 0) && (n > 0)){
        return ackermann(m - 1, ackermann(m, n - 1));
    }
}

int main(){
    int result;
    result = ackermann(1, 2); // try changing inputs
    printf("%d", result);

    return 0;
}`;

const fibonacci_example = `// Fibonacci sequence example
/* Demonstrates a recursive implementation of the Fibonacci sequence,
 * where each number is the sum of the two preceding ones.
 * The sequence is defined as:
 * Fib(0) = 0, Fib(1) = 1, Fib(n) = Fib(n-1) + Fib(n-2)
 * See more at https://en.wikipedia.org/wiki/Fibonacci_sequence */

int fibonacci(int n){
	if(n == 0){
		return 0;
	}else if(n == 1){
		return 1;
	}else{
		return fibonacci(n-1) + fibonacci(n-2);
	}
}

int main(){
	int result = fibonacci(8);

	return 0;
}`;

const binary_search_example = `// Binary search
/* Demonstrates an iterative implementation of binary search,
 * an efficient O(log n) algorithm for finding elements in a
 * sorted array by repeatedly dividing the search interval in half. */

int binarySearch(int array[], int size, int target){
    int low = 0;
    int high = size - 1;
    
    while(low <= high){
        int mid = low + (high - low) / 2; // avoids overflow
        
        if(array[mid] == target){
            return mid; // target found
        }else if(array[mid] < target){
            low = mid + 1; // search right half
        }else{
            high = mid - 1; // search left half
        }
    }
    
    return -1; // target not found
}

int main() {
    int sortedArray[] = {1, 5, 9, 18, 27, 30, 35, 44, 56, 71, 99, 123, 159, 270};
    int size = sizeof(sortedArray) / sizeof(sortedArray[0]);
    int target = 123;
    
    int index = binarySearch(sortedArray, size, target);
    
    return 0;
}`;

const exponation_example = `// Power function example
/* This example shows three different ways to compute
 * power of a number: iterative, recursive, and using
 * pointers. */

// Iterative version of power calculation
int powIterative(int base, int exponent){
    int result = 1;
    for(int i = 0; i < exponent; i++){
        result *= base;
    }
    return result;
}

// Recursive version of power calculation
int powRecursive(int base, int exponent){
    if(exponent == 0) return 1;
    return base * powRecursive(base, exponent - 1);
}

// Power calculation using a pointer to store the result
void powPointer(int base, int exponent, int *result){
    *result = 1;
    for(int i = 0; i < exponent; i++){
        *result *= base;
    }
}

int main(void){
    int base = 2;
    int exponent = 5;

    // 1. Iterative approach
    int result1 = powIterative(base, exponent);

    // 2. Recursive approach
    int result2 = powRecursive(base, exponent);

    // 3. Pointer-based approach
    int result3;
    powPointer(base, exponent, &result3);

    // Print the results
    printf("%d\\n", result1); // iterative
    printf("%d\\n", result2); // recursive
    printf("%d\\n", result3); // pointer

    return 0;
}`;

/****************
 * OLD EXAMPLES *
 ****************/

const magnum_opus_example = `int main() {
	int x[][2][3] = {{{1, 2, 3}, {4, 5, 6}}, {{7, 8, 9}, {10, 11, 12}}};
	int* p = &x[0][1][1]; // pointer into array x

	int** pp = &p; // pointer to pointer
	int* arr_p[] = {p, *pp}; // array of pointers

	char hello[] = "Hello"; // string allocated on stack
 
	char* animals[3] = { // strings allocated in data segment
		"cats",
		"dogs",
		"lizards"
	};
 
	printf("I have %d %s\\n", *p, animals[2]);
	return 0;
}`;

// this one is mostly for debugging
const errors_example = `void foo(int x);
void bar();
int fnc();
int fnc = 10; // semantic error

void main() {
	int z = 1/0; // runtime error
  
	int *p;
	float f = 4.1;
	p = &f; // wrong pointer type (warning)
  
	//int *p; // semantic (redeclaration)
	*p = 10; // runtime error
  
	int x;
	int a = x; // uninitialized (warning)
  
	int fnc = 10; // ok

	// foo(); // semantic error
	foo(1); // OK
	bar(); // semantic error
  
	//y = 10; // semantic error
  
	int arr[5];
	arr[10] = 10; // runtime error
	//printf("%ul", sizeof(arr[0]));
	return 0; // return type with void (warning)
}

void foo(int x){
  
}`;

const function_returning_function_example = `void a(){
	printf("A");

    return;
}

void (*getFunction())(void) {
    return a(), a; // first calls a function, then returns pointer to the function
}

int main(){
	getFunction()(); // calls getFunction and then calls the 

	return 0;
}`;

const tree_example = `int main(){
    printf("    _    \\n");
    printf("   / \\\\  \\n");
    printf("  /   \\\\  \\n");
    printf(" /     \\\\ \\n");
    printf(" ------- \\n");
    printf("    |    \\n");
}`;

const infinite_recursion_example = `int a(){
	int i = 1;
	a();
	return i;
}

int main(){
	return a();
}`;

const different_memory_regions_example = `int a;
int b = "Hello world";
int c = 1;

int main(){
	int x = 42;
}`;
