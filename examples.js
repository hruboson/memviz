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
    int x = a;
	printf("%d", a); // prints value passed as an argument
}

void baz(){
    int x = a;
	printf("%d", a); // prints global a
}

void main(){
	int a = 2; // scope of new inner a, global a is hidden
	printf("%d", a);
	
	{
		int a = 3; // new scope, new a
		printf("%d", a);

		int x = 100;
		printf("%d", x);

		foo(a);
	} 

	// printf("%d", x); <-- ERROR, x is out of scope

	// a is once again equal to 2
	printf("%d", a);

	baz();

	// int a = 2; <-- ERROR, cannot reinitialize variable of the same name
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
	i = +i;
	return i;
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
