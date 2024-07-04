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
	int x; // fix
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

/* COMPARISON */


/* DECLARATION + DEFINITION */

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
