function interpretAll(input){
	var interpreter = new Interpreter();

	interpreter.compile(input);
	interpreter.interpret(Infinity);
	return interpreter.output;
}

describe('printf/console output', () => {
	it('prints hello world', () => {
		chai.assert.equal(interpretAll(hello_world), "Hello world");
	})
	it('prints correct result of expressions', () => {
		chai.assert.equal(interpretAll(expressions_shenanigans_test), "-82785");
	});
	it('prints correct value of allocated memory', () => {
		chai.assert.equal(interpretAll(malloc_pointer_arithmetic_test), "10201346780210");
	});
	it('prints fry\'s lizards', () => {
		chai.assert.equal(interpretAll(arrays_strings_pointers_test), "I'm gonna buy 500 lizards<br>");
	});
});
