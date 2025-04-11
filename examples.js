/**
 * @file Examples for HTML frontend. Code snippets are loaded using the Example dropdown.
 * @author Ondřej Hruboš
 */

const simple_variables_example = `int a = 42;
int b = 42;

void main(){
	int a = 73;
	int b = 37;
}`

const simple_array_example = `int arr2d[10][10] = { {0, 1, 2, [5]=5 }, [10]={90, 91, [10]=100} };

void main(){
	arr2d[5][5] = 55;
}
`;


/*
typedef struct String {
	char* data;
	size_t length, capacity;
} String;
*/
const struct_example = `typedef struct Employee {
	int employee_number;
	float salary;
} Employee;

void main(){
	Employee e;
	e.employee_number = 1;
	e.salary = 999999;
}

`;

const union_example = `union number_holder {
	int i;
	float f;
	double d;
};

void main(){
	union number_holder num = 42;

	num.f = 4.2f;
	num.d = 3.7;
}
`;

const enum_example = `enum weekdays { 
	MONDAY = 1, 
	TUESDAY = 2, 
	WEDNESDAY = 3, 
	THURSDAY = 4, 
	FRIDAY = 5, 
	SATURDAY = 6, 
	SUNDAY = 7
};

enum year {
	Jan, Feb, Mar, Apr, 
	May, Jun, Jul, Aug, 
	Sep, Oct, Nov, Dec
};
`;

const anonymous_example = `//source: https://en.cppreference.com/w/c/language/struct

struct v
{
   union // anonymous union
   {
      struct { int i, j; }; // anonymous structure
      struct { long k, l; } w;
   };
   int m;
} v1;
`;

const typedef_example = `typedef long long int lli;

void main(){
	lli big_number = 9223372036854775807; // long long int maximum
}
`;

const scopes_example = `int a = 1; // initialize symbol a with value 1 (global scope)

void foo(int a){ // global scope is hidden
    int a = a;
	printf("%d", a); // prints value passed as an argument
}

void baz(){
    int x = a;
	printf("%d", a); // prints global a
}

void main(){
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
}`;

const declaration_example = `void foo();

void main(){
	foo();
	// bar(); // Error - undeclared function
}

void foo(){
	printf("foo");
}

void bar(){
	printf("bar");
}
`;

// this one is mostly for debugging
// commented errors are working
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

const expressions_example = `int main(){
	int i;
	i = +10;
	i += 10;
	i++;
	++i;
	i = i + (10 + (20 + 30));
	i = -i;

	int guess;
	guess = guess + (guess = 420, 69 + (guess = 666, 20 + 30));
	return i;
}`;

const pointer_dereferencing_example = `int main(){
	int x = 10; // value
	
	int *p; // pointer to value
	p = &x;
	
	int **pp = &p; // pointer to pointer to value
}`;

const function_pointer_example = `int a(){
	return 1;
}

void main() {
	int (*b)() = &a;
	return (*b)();
}`;

const function_returning_function_example = `void a(){
    return;
}

void (*getFunction())(void) {
    return a(), a;
}

void main(){
	getFunction()();
}`;

const function_simple_example = `void hello(){
	char a[] = "Hello world";
	return;
}

void main(){
	hello();
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

const different_memory_sizes_example = `int main() {
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
	long double ld = 6.28318;	// size 8 bytes

    return 0;
}`;

const if_example = `int main(){
	if(1){
		printf("Yay");
	}else{
		printf("Nope");
	}

	if(0){
		printf("Nope");
	}else{
		printf("Yay");
	}
}`;

const switch_example = `int main(){
	enum DAYS { monday, tuesday, wednesday, thursday, friday, saturday, sunday };
    enum DAYS day = friday;

    switch (day) {
        case monday:
            printf("Monday\\n");
            break;
        case tuesday:
            printf("Tuesday\\n");
            break;
        case wednesday:
            printf("Wednesday\\n");
            break;
        case thursday:
            printf("Thursday\\n");
            break;
        case friday:
            printf("Friday\\n");
            break;
        case saturday:
            printf("Saturday\\n");
            break;
        case sunday:
            printf("Sunday\\n");
            break;
        default:
            printf("Invalid input! Please enter a number between 1 and 7.\\n");
            break;
    }

    return 0;
}`;



const for_loop_example = `int main(){
	for(int x = 0; x < 5; x++){
    	for(int y = 0; y < 5; y++){
    	    if((y < 1 || y > 3) || (x < 1 || x > 3)){
    		    printf("X");
    	    }else{
    	        printf(" ");
    	    }
    	}
    	printf("\\n");
	}
}`;

const while_loop_example = `int main(){
	int x = 0;
	while(x < 5){
		printf("%d", x);
		x++;
	}
	
	int y = 0;
	do{
		printf("%d", y);
		y++;
	}while(y < 5);
}`;

const pointer_arithmetic_example = `int main(){
	int q = 10;
	int s = 5;
	int* p = &q;
	int a[3];

	printf("Address of a: %p\\n",    a);
	printf("Address of a[1]: %p\\n", &a[1]);
	printf("Address of a[2]: %p\\n", &a[2]);
	printf("Address of q: %p\\n",    &q);
	printf("Address of s: %p\\n",    &s);

	printf("s: %d\\n",    s);
	printf("s using q pointer: %d\\n ", *(p-1));
}`;

const malloc_no_free_example = `int main() {
    int* ptr = (int*) malloc(sizeof(int)); // allocate memory
    if (ptr == NULL) {
        return 1;
    }

    *ptr = 99;
    printf("%d", *ptr);

    // No call to free(ptr) — memory leak

    return 0;
}`;

const malloc_free_example = `int main() {
    int* ptr = (int*) malloc(sizeof(int)); // allocate memory for one int
    if (ptr == NULL) {
        return 1;
    }

    *ptr = 42; // assign value
    printf("%d", *ptr);

    free(ptr); // free allocated memory

    return 0;
}`;
