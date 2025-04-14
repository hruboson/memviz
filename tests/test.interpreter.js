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
		chai.assert.equal(interpretAll(expressions_shenanigans), "-82785");
	});
	it('prints correct value of allocated memory', () => {
		chai.assert.equal(interpretAll(malloc_pointer_arithmetic), "10201346780210");
	});
});
