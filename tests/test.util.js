describe('stack', () => {
	it('init', () => {
		var stack = new Stack();

		chai.assert.equal(stack.peek(), null);
		chai.assert.equal(stack.top(), null);

		stack.pop();
		chai.assert.equal(stack.peek(), null);
	});

	it('push/pop/peek', () => {
		var stack = new Stack();

		var i = 0;
		while(i <= 500){
			stack.push(i);
			i++;
		}

		chai.assert.equal(stack.peek(), 500);
		chai.assert.equal(stack.top(), 500);

		var t = stack.pop();
		chai.assert.equal(t, 500);
		chai.assert.equal(stack.top(), 499);

		stack.push(1000);
		chai.assert.equal(stack.top(), 1000);
	});
});

