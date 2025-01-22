/**
 * @file Symbol table
 * @author Ondřej Hruboš
 */

/**
 * @class CallStack
 */
class CallStack extends Stack {
	call(){
		const tobeinterpreted = this.top();

		//console.log(tobeinterpreted.body);

		this.pop();
	}
}
