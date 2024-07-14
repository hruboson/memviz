var parser = require('../src/parser/ansi_c.js').parser;

function parse(input){
	parser.parse(input);
}

/*
CORRECT SNIPPETS - EXPECT NO ERROR
*/

/* COMMENTS */
const endln_comments = `
// comment before main
void main(){ // comment after code;
	// hello, this is a comment
	// 🅵🅳🅵🆂🅰🅰🅶🅰🆂🅳🅶🅰🆂🅳🅵🅻🅹ů🅻
	// ᎦᎴᎦᏕᏗᏗᎶᏗᏕᎴᎶᏗᏕᎴᎦᏝᏠůᏝ
	// ⛵👊  ᵃ𝐬ᵈ𝕗𝐆ʰｋĴ𝐤ℓ+ěš+ěščýáíéřčžéý  💙♤
	// -漫~*'¨¯¨'*·舞~   🎀  𝒶𝓈𝒹𝒻𝑔𝒽𝓀𝒿𝓀𝓁+ěš+ěščýáíéřčžéý  🎀   ~舞·*'¨¯¨'*~漫-
	// printf()
	int i; // declare i
	while(i > 1) printf("a"); // loop
}   // comment after code
// comment after main
`;

describe('correct', () => {
	test('end line comments', () => {
		expect(() => parse(endln_comments)).not.toThrow(Error);
	});
});

const multiline_comments = `
/*

outside

*/
void main(){
    /*
  
  /**

/********
    many
  
   
    spaces*/
    
    int i = 10;/* This is a multiline
    comment */
    i += 1;/**/
    /* multiline and */// endline
	return;
}
/* outsi

/* /* /*
de

*/
`;
describe('correct', () => {
	test('multiline comments', () => {
		expect(() => parse(multiline_comments)).not.toThrow(Error);
	});
});

/* ARITHMETIC */
const addition_all = `
void main(){
	int i;
	i = +10;
	i += 10;
	i++;
	++i;
	i = i + (10 + (20 + 30));
	i = +i;
}
`;

describe('correct', () => {
	test('addition', () => {
		expect(() => parse(addition_all)).not.toThrow(Error);
	});
});

const substraction_all = `
void main(){
	int i;
	i = -10;
	i -= 10;
	i--;
	--i;
	i = i - (10 - (20 - 30));
	i = -i;
}
`;

describe('correct', () => {
	test('substraction', () => {
		expect(() => parse(substraction_all)).not.toThrow(Error);
	});
});

const multiplication_all = `
void main(){
	int i;
	i = 10;
	i *= 10;
	i = i * i;
	i = i * (10 * (i * 20));
}
`;

describe('correct', () => {
	test('multiplication', () => {
		expect(() => parse(multiplication_all)).not.toThrow(Error);
	});
});

const division_all = `
void main(){
	int i;
	i = 10;
	i /= 10;
	i = i / i;
	i = i / (10 / (i / 20));
}
`;

describe('correct', () => {
	test('division', () => {
		expect(() => parse(division_all)).not.toThrow(Error);
	});
});

const modulo = `
void main(){
	int i = 20;
	i = i % (10 % (3 % 5));
}
`;

describe('correct', () => {
	test('modulo', () => {
		expect(() => parse(modulo)).not.toThrow(Error);
	});
});

/* BITWISE + LOGICAL */

const bitwise = `
void main(){
	int hex = 0xFFFF;
	hex = hex & hex;
	hex = 0xFF & 0x0F;
	hex = 0xFFFF & hex;
	hex = hex | hex;
	hex = 0xFF | 0x0F;
	hex = 0xFFFF | hex;
	hex = ~hex;
	hex = ~0xFF;
	hex = ~(~0xFFFF & hex);
	hex = hex ^ hex;
	hex = 0xFF ^ 0x0F;
	hex = 0xFFFF ^ hex;
}
`;

describe('correct', () => {
	test('bitwise', () => {
		expect(() => parse(bitwise)).not.toThrow(Error);
	});
});

const logical = `
void main(){
	int t = 1;
	int f = 0;
	t = !f;
	f = !t;
	t = !1;
	f = !0;
	int x;
	x = t && f;
	x = t || f;
	x = 1 && 0;
	x = 1 || 0;
	x = 1 && 1;
	x = 1 || t;
	x = t && (f || (t && 1));
}
`;

describe('correct', () => {
	test('logical', () => {
		expect(() => parse(logical)).not.toThrow(Error);
	});
});

/* CONDITIONS */

const conditions = `
void main(){
	int i = 1;
	if    (i == 1)
	{
		if(
			i != 1
		){
			return;
		}else{
			return;
		}
	}else if(i != 1){
		return;
	}else{
		int i = 10;
		int x = 11;
		int res_1 = (i >= 0) ? 1 : 0;
		int res_2 = (i <= 0) ? i*2 : (x + i);
	}
	
	if(i > 0 && i < 2 && i == 1 || i != 1 || i != 2){
		return;
	}

	if (i) return; else printf("Hello world");
	if (i)
		if(i && 0xFF)
			return;
		else // matches closest if (no dangling else problem)
			return;
}
`;

describe('correct', () => {
	test('conditions + comparisons + ternary op', () => {
		expect(() => parse(conditions)).not.toThrow(Error);
	});
});

/* DECLARATION + DEFINITION */

const declarations = `
struct coordinates {
	int x;
	int y;
};

enum weekdays { MONDAY = 1, TUESDAY = 2, WEDNESDAY = 3, THURSDAY = 4, FRIDAY = 5, SATURDAY = 6, SUNDAY = 7 };
enum year{Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec};

signed char global_char;
long long global_int;

int main(){
	int* pi;
	float* pf;
	double* df;
	struct coordinates coord;
	struct coordinates* coord_ptr;	
	
	signed char sc;
	unsigned char uc;
	char c;
	short s;
	short int si;

	int i;
	long l;
	long int li;
	long long ll;
	long long int;

	unsigned int ui;
	unsigned long ul;
	unsigned long long ull;
	unsigned long long int ulli;
	unsigned long int uli;

	float f;
	double d;
	long double ld;

	_Bool b;

	int arr2d[10][10];
	int arr2d_big[1000000000][1000000000];
	float arr2d_f[2][2];
	unsigned long long arr2d_ull[MONDAY][+1];
}
`;

describe('correct', () => {
	test('declarations', () => {
		expect(() => parse(declarations)).not.toThrow(Error);
	});
});

const definitions = `
// todo IMAGINARY and COMPLEX
struct coordinates {
	int x;
	int y;
};

enum weekdays { MONDAY = 1, TUESDAY = 2, WEDNESDAY = 3, THURSDAY = 4, FRIDAY = 5, SATURDAY = 6, SUNDAY = 7 };
enum year{Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec};

signed char global_char;
long long global_int;

int main(){
	struct coordinates coord;
	coord.x = 10;
	coord.y = 20;
	struct coordinates* coord_ptr = &coord;
	enum weekday monday = MONDAY;
	enum year january = JANUARY;

	signed char sc = 'a';
	unsigned char uc = '♤';
	char c = '\u6c42';
	short s = -4242;
	short int si = 0xFA;

	int i = 42;
	long l = 011;
	long int li = 0b010101110;
	long long ll = 0B01100100;
	long long int lli = 999999999;

	unsigned int ui = 123;
	unsigned long ul = 0424224;
	unsigned long long ull = 0xFFFFFFF;
	unsigned long long int ulli = 0xFFFFFF;
	unsigned long int uli = -424242;

	float f = 1.1;
	float f1 = .1;
	float f2 = .0042;
	float f3 = 1e0;
	float f4 = 1.00000e0;
	float f5 = 42.f;
	float f6 = 0.42e-2;
	double d = 42E3F;
	long double ld;

	_Bool bt = true;
	_Bool bf = false;

	int* pi = &i;
	float* pf = &f;
	double* df = &d;
}
`;

describe('correct', () => {
	test('definitions', () => {
		expect(() => parse(definitions)).not.toThrow(Error);
	});
});

const typedef_declaration_definition = `
typedef int i;
typedef long long ll;

typedef struct coordinates {
	int x;
	int y;
} COORDINATES;

int main(){
	i a = 1;
	ll b = 4242424242;

	COORDINATES xy;
	xy.x = 1;
	xy.y = 0;
	COORDINATES* xy_p = &xy;

	return xy.x;
}
`;

describe('correct', () => {
	test('typdef', () => {
		expect(() => parse(typedef_declaration_definition)).not.toThrow(Error);
	});
});

const function_definition_declaration = `
void life(_Bool a, float f, int* ptr, char** array_2d, double ***what){
	return;
}

int addition(int a, int b){
	return a + b;
}

void nop(){
	return;
}

float pi(){
	return 3.14;
}

int main(){
	int a;
	int field[3][4];
	double d;
	double* dd = &d;
	double** ddd = &dd;
	double*** dddd = &ddd;
	life(true, 3.14, &a, field, dddd);
	nop();
	float pi = pi();
	return addition(-1, 1);
}
`;

describe('correct', () => {
	test('function definition, declaration, calls', () => {
		expect(() => parse(function_definition_declaration)).not.toThrow(Error);
	})
});

/* SIMPLE CF STATEMENTS */

const while_loop_simple = `
int main() {
	int count = 0;

	while (count < 5) {
		putchar('*');
		count++;
	}

	putchar('\n');
	return 0;
}
`;

describe('correct', () => {
	test('while loop', () => {
		expect(() => parse(while_loop_simple)).not.toThrow(Error);
	});
});

const do_while_loop_simple = `
void main()       {
	int count = 0;
	do {
		count++;
	}while(
		count <= 5
	);
}
`;

describe('correct', () => {
	test('do while loop', () => {
		expect(() => parse(do_while_loop_simple)).not.toThrow(Error);
	});
});

const for_loop_simple = `
int main() {
	for (int i = 0; i < 10; ++i){
		printf("%d", i);
	}

	return 0;
}
`;

describe('correct', () => {
	test('for loop', () => {
		expect(() => parse(for_loop_simple)).not.toThrow(Error);
	});
});

const switch_case_simple = `
void main(){
	int a = 1;
	switch(a){
		case 1:
			return;
		case 2:
			break;
		default:
			break;
	}
}
`;

describe('correct', () => {
	test('switch', () => {
		expect(() => parse(switch_case_simple)).not.toThrow(Error);
	});
});

const goto_simple = `
int main(){
	int num = 20;
	if (num % 2 == 0) 
		goto even_label; 
    else
		goto odd_label;

even_label:
	return 2;
odd_label:
	return 3;
return 1;
}
`;

describe('correct', () => {
	test('goto', () => {
		expect(() => parse(goto_simple)).not.toThrow(Error);
	});
});

const continue_break_simple = `
void main(){
	int a = 10;
	while(a > 0){
		if(a == 5) continue;
		if(a == 1) break;
		a--;
	}
}
`;

describe('correct', () => {
	test('continue + break', () => {
		expect(() => parse(continue_break_simple)).not.toThrow(Error);
	});
});

/* SIMPLE PROGRAMS */

const hello_world = `
int main(){
	printf("Hello world");
	return 0;
}
`;

describe('correct', () => {
	test('hello world', () => {
		expect(() => parse(hello_world)).not.toThrow(Error);
	});
});

/*
INCORRECT SNIPPETS - EXPECT ERROR
*/

const no_function = `
int a = 1;
int i = a++;
return;
`;

describe('incorrect', () => {
	test('no function', () => {
		expect(() => parse(no_function)).toThrow(Error);
	});
});

const comment_not_ended = `
int main(){ /*
	return;
}
`;

describe('incorrect', () => {
	test('multiline comment not ended', () => {
		expect(() => parse(comment_not_ended)).toThrow(Error);
	});
});

const wrong_type = `
int main(){
	imt i;
	triple t;
	sinking s;
	return 1;
}
`;

describe('incorrect', () => {
	test('wrong types', () => {
		expect(() => parse(wrong_type)).toThrow(Error);
	});
});
