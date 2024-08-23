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
