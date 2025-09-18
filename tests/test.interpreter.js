function interpretAll(input){
	var interpreter = new Interpreter();

	interpreter.compile(input);
	const ret = interpreter.interpret(Infinity);
	return { output: interpreter.output, main: ret };
}

describe("printf/console output", () => {
	it("prints hello world", () => {
		chai.assert.equal(interpretAll(hello_world).output, "Hello world");
	})
	it("prints correct result of expressions", () => {
		chai.assert.equal(interpretAll(expressions_shenanigans_test).output, "-82785");
	});
	it("prints fry\'s lizards", () => {
		chai.assert.equal(interpretAll(arrays_strings_pointers_test).output, "I\'m gonna buy 500 lizards<br>");
	});
	it("prints correct values of binary compare expresssions", () => {
		chai.assert.equal(interpretAll(bcomp_expressions_test).output, "102345");
	});
	it("prints loop sequence", () => {
		chai.assert.equal(interpretAll(for_loop_simple).output, "0123456789");
	});
	it("prints values of array", () => {
		chai.assert.equal(interpretAll(for_loop_with_array_test).output, "01234");
	});
	it("prints AB", () => {
		chai.assert.equal(interpretAll(brackets_test).output, "AB");
	})
});

describe("interprets fully", () => {
	it("malloc in function returning pointer", () => {
		chai.expect(interpretAll(malloc_function_test).main).to.equal(0);
	});
});

describe("stops interpretation", () => {
	it("throws invalid address error", () => {
		chai.expect(interpretAll(malloc_function_broken_test).main).to.not.equal(0);
	});
});

describe("examples", () => {
	it("variables_example", () => {
		chai.expect(interpretAll(variables_example).main).to.equal(0);
	});

	it("functions_example", () => {
		chai.expect(interpretAll(functions_example).main).to.equal(0);
	});

	it("scopes_example", () => {
		chai.expect(interpretAll(scopes_example).main).to.equal(0);
	});

	it("expressions_example", () => {
		chai.expect(interpretAll(expressions_example).main).to.equal(0);
	});

	it("typedef_example", () => {
		chai.expect(interpretAll(typedef_example).main).to.equal(0);
	});

	it("if_else_example", () => {
		chai.expect(interpretAll(if_else_example).main).to.equal(0);
	});

	it("for_loop_example", () => {
		chai.expect(interpretAll(for_loop_example).main).to.equal(0);
	});

	it("for_loop_advanced_example", () => {
		chai.expect(interpretAll(for_loop_advanced_example).main).to.equal(0);
	});

	it("while_loop_example", () => {
		chai.expect(interpretAll(while_loop_example).main).to.equal(0);
	});

	it("do_while_loop_example", () => {
		chai.expect(interpretAll(do_while_loop_example).main).to.equal(0);
	});

	it("switch_example", () => {
		chai.expect(interpretAll(switch_example).main).to.equal(0);
	});

	it("pointers_example", () => {
		chai.expect(interpretAll(pointers_example).main).to.equal(0);
	});

	it("array_example", () => {
		chai.expect(interpretAll(array_example).main).to.equal(0);
	});

	it("strings_example", () => {
		chai.expect(interpretAll(strings_example).main).to.equal(0);
	});

	it("type_sizes_example", () => {
		chai.expect(interpretAll(type_sizes_example).main).to.equal(0);
	});

	it("pointer_arithmetic_example", () => {
		chai.expect(interpretAll(pointer_arithmetic_example).main).to.equal(0);
	});

	it("malloc_example", () => {
		chai.expect(interpretAll(malloc_example).main).to.equal(0);
	});

	it("free_example", () => {
		chai.expect(interpretAll(free_example).main).to.equal(0);
	});

	it("multidimensional_arrays_example", () => {
		chai.expect(interpretAll(multidimensional_arrays_example).main).to.equal(0);
	});

	it("pointer_arrays_example", () => {
		chai.expect(interpretAll(pointer_arrays_example).main).to.equal(0);
	});

	it("calloc_example", () => {
		chai.expect(interpretAll(calloc_example).main).to.be.equal(0);
	});

	it("string_reversal_example", () => {
		chai.expect(interpretAll(string_reversal_example).main).to.equal(0);
	});

	it("advanced_malloc", () => {
		chai.expect(interpretAll(advanced_malloc).main).to.equal(0);
	});

	it("min_max_example", () => {
		chai.expect(interpretAll(min_max_example).main).to.equal(0);
	});

	it("array_average_example", () => {
		chai.expect(interpretAll(array_average_example).main).to.equal(0);
	});

	it("recursive_factorial_example", () => {
		chai.expect(interpretAll(recursive_factorial_example).main).to.equal(0);
	});

	it("ackermann_example", () => {
		chai.expect(interpretAll(ackermann_example).main).to.equal(0);
	});

	it("fibonacci_example", () => {
		chai.expect(interpretAll(fibonacci_example).main).to.equal(0);
	});

	it("binary_search_example", () => {
		chai.expect(interpretAll(binary_search_example).main).to.equal(0);
	});

	it("exponation_example", () => {
		chai.expect(interpretAll(exponation_example).main).to.equal(0);
	});
});
