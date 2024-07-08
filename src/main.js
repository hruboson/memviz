var parser = require("./parser/ansi_c.js").parser;

function execute(input){
	return parser.parse(input);
}

return execute(`
int main(){
	//printf('a'); 
	int a = 0;
	a++;
	int b = 1;
	// comment

	// printf() displays the string inside quotation
	printf("Hello, World!");
	return 0;
}
`);
