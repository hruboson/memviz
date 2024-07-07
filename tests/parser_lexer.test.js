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
	int i; // declare i
	while(i > 1) printf("a"); // loop
}   // comment after code
// comment after main
`;

test('end line comments', () => {
	expect(() => parse(endln_comments)).not.toThrow(Error);
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
test('multiline comments', () => {
	expect(() => parse(multiline_comments)).not.toThrow(Error);
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

test('addition', () => {
	expect(() => parse(addition_all)).not.toThrow(Error);
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

test('substraction', () => {
	expect(() => parse(substraction_all)).not.toThrow(Error);
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

test('multiplication', () => {
	expect(() => parse(multiplication_all)).not.toThrow(Error);
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

test('division', () => {
	expect(() => parse(division_all)).not.toThrow(Error);
});

const modulo = `
void main(){
	int i = 20;
	i = i % (10 % (3 % 5));
}
`;

test('modulo', () => {
	expect(() => parse(modulo)).not.toThrow(Error);
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

test('bitwise', () => {
	expect(() => parse(bitwise)).not.toThrow(Error);
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

test('logical', () => {
	expect(() => parse(logical)).not.toThrow(Error);
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

test('conditions + comparisons', () => {
	expect(() => parse(conditions)).not.toThrow(Error);
});

/* TYPES (BASIC + DEFINITION) */

/* DECLARATION + DEFINITION */

const declarations = `
typedef struct {
	int x;
	int y;
} COORDINATES;

signed char global_char;
long long global_int;

int main(){
	int* pi;
	float* pf;
	double* df;
	//COORDINATES coord;
	//COORDINATES* coord_ptr;	
	
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
}
`;

test('Declarations', () => {
	expect(() => parse(declarations)).not.toThrow(Error);
});

const definitions = `
// todo IMAGINARY and COMPLEX
typedef struct {
	int x;
	int y;
} COORDINATES;

signed char global_char;
long long global_int;

int main(){
	//COORDINATES coord;
	coord.x = 10;
	coord.y = 20;
	//COORDINATES* coord_ptr = &coord;

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

test('Definitions', () => {
	expect(() => parse(definitions)).not.toThrow(Error);
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
	return 0;
}
`;

test('Function definition and declaration', () => {
	expect(() => parse(function_definition_declaration)).not.toThrow(Error);
});

/* SIMPLE PROGRAMS */

const hello_world = `
int main(){
	printf("Hello world");
	return 0;
}
`;

test('hello world', () => {
	expect(() => parse(hello_world)).not.toThrow(Error);
});

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

test('simple while', () => {
	expect(() => parse(while_loop_simple)).not.toThrow(Error);
});

const for_loop_simple = `
int main() {
	for (int i = 0; i < 10; ++i){
		printf("%d", i);
	}

	return 0;
}
`;

test('simple for', () => {
	expect(() => parse(for_loop_simple)).not.toThrow(Error);
});

/* WEIRD */

/* source: https://www.a1k0n.net/2006/09/15/obfuscated-c-donut.html */
const donut = `
            k;double sin()
         ,cos();main(){float A=
       0,B=0,i,j,z[1760];char b[
     1760];printf("\x1b[2J");for(;;
  ){memset(b,32,1760);memset(z,0,7040)
  ;for(j=0;6.28>j;j+=0.07)for(i=0;6.28
 >i;i+=0.02){float c=sin(i),d=cos(j),e=
 sin(A),f=sin(j),g=cos(A),h=d+2,D=1/(c*
 h*e+f*g+5),l=cos      (i),m=cos(B),n=s\
in(B),t=c*h*g-f*        e;int x=40+30*D*
(l*h*m-t*n),y=            12+15*D*(l*h*n
+t*m),o=x+80*y,          N=8*((f*e-c*d*g
 )*m-c*d*e-f*g-l        *d*n);if(22>y&&
 y>0&&x>0&&80>x&&D>z[o]){z[o]=D;;;b[o]=
 ".,-~:;=!*#$@"[N>0?N:0];}}/*#****!!-*/
  printf("\x1b[H");for(k=0;1761>k;k++)
   putchar(k%80?b[k]:10);A+=0.04;B+=
     0.02;}}/*****####*******!!=;:~
       ~::==!!!**********!!!==::-
         .,~~;;;========;;;:~-.
             ..,--------,*/
`;

/*test('donut', () => {
	expect(() => parse(donut)).not.toThrow(Error);
}); lets not do that for now :-) gcc is crazy */


/*
INCORRECT SNIPPETS - EXPECT ERROR
*/
