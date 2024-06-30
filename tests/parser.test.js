var parser = require('../src/parser/ansi_c.js').parser;

function parse(input){
	parser.parse(input);
}

const hello_world = `
int main(){
	printf("Hello world");
	return 0;
}
`;

const addition = `
int main() {
	int a = 5;
	int b = 3;
	int sum = a + b;
	return sum;
}
`;

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

const for_loop_simple = `
int main() {
	for (int i = 0; i < 10; ++i){
		printf("%d", i);
	}

	return 0;
}
`; 

test('hello world program', () => {
	expect(parse(hello_world)).toBe(undefined); // after I add AST generation change this to something else
});

test('simple addition', () => {
	expect(parse(addition)).toBe(undefined);
});

test('simple while', () => {
	expect(parse(while_loop_simple)).toBe(undefined);
});

test('simple for', () => {
	expect(parse(for_loop_simple)).toBe(undefined);
});


