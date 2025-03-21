function parse(input){
	var interpreter = new Interpreter();

	interpreter.parse(input);
}

/*
 * CORRECT SNIPPETS - EXPECT NO ERROR
 */

describe('parser correct', () => {
	it('multiline comments', () => {
		chai.expect(function() { parse(multiline_comments); }).to.not.throw()
	});
	it('multiline comments - code inside and at the end', () => {
		chai.expect(function() { parse(multiline_double_main); }).to.not.throw()
	});
	it('addition', () => {
		chai.expect(function() { parse(addition_all); }).to.not.throw()
	});
	it('substraction', () => {
		chai.expect(function() { parse(substraction_all); }).to.not.throw()
	});
	it('multiplication', () => {
		chai.expect(function() { parse(multiplication_all); }).to.not.throw()
	});
	it('division', () => {
		chai.expect(function() { parse(division_all); }).to.not.throw()
	});
	it('modulo', () => {
		chai.expect(function() { parse(modulo); }).to.not.throw()
	});
	it('bitwise', () => {
		chai.expect(function() { parse(bitwise); }).to.not.throw()
	});
	it('logical', () => {
		chai.expect(function() { parse(logical); }).to.not.throw()
	});
	it('conditions + comparisons + ternary op', () => {
		chai.expect(function() { parse(logical); }).to.not.throw()
	});
	it('declarations', () => {
		chai.expect(function() { parse(declarations); }).to.not.throw()
	});
	it('definitions', () => {
		chai.expect(function() { parse(definitions); }).to.not.throw()
	});
	it('anonymous struct and union', () => {
		chai.expect(function() { parse(anonymous_struct_union); }).to.not.throw()
	});
	it('typedef', () => {
		chai.expect(function() { parse(typedef_declaration_definition); }).to.not.throw()
	});
	it('function definition, declaration, calls', () => {
		chai.expect(function() { parse(function_definition_declaration); }).to.not.throw()
	});
	it('array designator', () => {
		chai.expect(function() { parse(array_designator); }).to.not.throw()
	});
	it('while loop', () => {
		chai.expect(function() { parse(while_loop_simple); }).to.not.throw()
	});
	it('do while loop', () => {
		chai.expect(function() { parse(do_while_loop_simple); }).to.not.throw()
	});
	it('for loop', () => {
		chai.expect(function() { parse(for_loop_simple); }).to.not.throw()
	});
	it('switch', () => {
		chai.expect(function() { parse(switch_case_simple); }).to.not.throw()
	});
	it('end line comments', () => {
		chai.expect(function() { parse(endln_comments); }).to.not.throw();
	});
	it('continue + break', () => {
		chai.expect(function() { parse(continue_break_simple); }).to.not.throw()
	});
	it('goto', () => {
		chai.expect(function() { parse(goto_simple); }).to.not.throw()
	});
	it('hello world', () => {
		chai.expect(function() { parse(hello_world); }).to.not.throw()
	});
});

/*
 * INCORRECT SNIPPETS - EXPECT ERROR
 */

describe('parser incorrect', () => {
	it('no function', () => {
		chai.expect(function() { parse(no_function); }).to.throw()
	});
	it('multiline comment not ended', () => {
		chai.expect(function() { parse(comment_not_ended); }).to.throw()
	});
	it('wrong types', () => {
		chai.expect(function() { parse(wrong_type); }).to.throw()
	});
});
