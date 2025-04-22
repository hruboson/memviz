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
	it('prints correct values of binary compare expresssions', () => {
		chai.assert.equal(interpretAll(bcomp_expressions_test), "102345");
	});
	it('prints loop sequence', () => {
		chai.assert.equal(interpretAll(for_loop_simple), "0123456789");
	});
	it('prints values of array', () => {
		chai.assert.equal(interpretAll(for_loop_with_array_test), "01234");
	});
});
