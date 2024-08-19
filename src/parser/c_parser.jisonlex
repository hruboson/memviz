O   [0-7]
D   [0-9]
NZ  [1-9]
L   [a-zA-Z_]
A   [a-zA-Z_0-9]
H   [a-fA-F0-9]
HP  ("0"[xX])
B	("0"[bB])
E   ([Ee][+-]?{D}+)
P   ([Pp][+-]?{D}+)
FS  [fFlL]
IS  [uUlL]*
CP 	[uUL] 
SP  ("u8"|[uUL])
ES  (\\(['"?\abfnrtv]|[0-7]{1,3}|"x"[a-fA-F0-9]+))
WS  [\s\t\v\n\f]

%%
"/*"			{ 
					var curr, prev;
					curr = this.input();

					while(!(curr == '/' && prev == '*') && this._input.length > 1){
						prev = curr;
						curr = this.input();
					} 
				}
"//"[^\n]*      { /* skip until end of line//-comment */ }

"auto"			{ return 'AUTO'; }
"break"			{ return 'BREAK'; }
"case"			{ return 'CASE'; }
"char"			{ return 'CHAR'; }
"const"			{ return 'CONST'; }
"continue"		{ return 'CONTINUE'; }
"default"		{ return 'DEFAULT'; }
"do"			{ return 'DO'; }
"double"		{ return 'DOUBLE'; }
"else"			{ return 'ELSE'; }
"enum"			{ return 'ENUM'; }
"extern"		{ return 'EXTERN'; }
"float"			{ return 'FLOAT'; }
"for"			{ return 'FOR'; }
"goto"			{ return 'GOTO'; }
"if"			{ return 'IF'; }
"int"			{ return 'INT'; }
"long"			{ return 'LONG'; }
"register"		{ return 'REGISTER'; }
"return"		{ return 'RETURN'; }
"short"			{ return 'SHORT'; }
"signed"		{ return 'SIGNED'; }
"sizeof"		{ return 'SIZEOF'; }
"static"		{ return 'STATIC'; }
"struct"		{ return 'STRUCT'; }
"switch"		{ return 'SWITCH'; }
"typedef"		{ return 'TYPEDEF'; }
"union"			{ return 'UNION'; }
"unsigned"		{ return 'UNSIGNED'; }
"void"			{ return 'VOID'; }
"volatile"		{ return 'VOLATILE'; }
"while"			{ return 'WHILE'; }
"_Alignas"		{ return 'ALIGNAS'; }
"_Alignof"      	{ return 'ALIGNOF'; }
// "_Atomic"       	{ return 'ATOMIC'; } // thread related stuff - not needed for now
"_Bool"         	{ return 'BOOL'; }
// "_Complex"      	{ return 'COMPLEX'; } skip for now
// "_Generic"      	{ return 'GENERIC'; }
// "_Imaginary"    	{ return 'IMAGINARY'; }
"_Noreturn"     	{ return 'NORETURN'; }
"_Static_assert" 	{ return 'STATIC_ASSERT'; }
"_Thread_local"  	{ return 'THREAD_LOCAL'; }
"__func__"       	{ return 'FUNC_NAME'; }

{D}+{E}{FS}?					{ return 'F_CONSTANT'; }
{D}*"."{D}+{E}?{FS}?			{ return 'F_CONSTANT'; }
{D}+"."{E}?{FS}?				{ return 'F_CONSTANT'; }
{HP}{H}+{P}{FS}?				{ return 'F_CONSTANT'; }
{HP}{H}*"."{H}+{P}{FS}?			{ return 'F_CONSTANT'; }
{HP}{H}+"."{P}{FS}?				{ return 'F_CONSTANT'; }

{B}[01]+						{ return 'I_CONSTANT'; }
{HP}{H}+{IS}?					{ return 'I_CONSTANT'; }
{NZ}{D}*{IS}?					{ return 'I_CONSTANT'; }
"0"{O}*{IS}?					{ return 'I_CONSTANT'; }
{CP}?"'"([^'\\\n]|{ES})+"'"		{ return 'I_CONSTANT'; }

({SP}?\"([^"\\\n]|{ES})*\"{WS}*)+	{ return 'STRING_LITERAL'; }

{L}({L}|{D})*		{ 
						if(parser.yy.symbols.types.includes(yytext)){
							return 'TYPEDEF_NAME';
						}else if(parser.yy.symbols.enums.includes(yytext)){
							return 'ENUMERATION_CONSTANT';
						}else{
							return 'IDENTIFIER';
						}
					}

"..."			{ return 'ELLIPSIS'; }
">>="			{ return 'RIGHT_ASSIGN'; }
"<<="			{ return 'LEFT_ASSIGN'; }
"+="			{ return 'ADD_ASSIGN'; }
"-="			{ return 'SUB_ASSIGN'; }
"*="			{ return 'MUL_ASSIGN'; }
"/="			{ return 'DIV_ASSIGN'; }
"%="			{ return 'MOD_ASSIGN'; }
"&="			{ return 'AND_ASSIGN'; }
"^="			{ return 'XOR_ASSIGN'; }
"|="			{ return 'OR_ASSIGN'; }
">>"			{ return 'RIGHT_OP'; }
"<<"			{ return 'LEFT_OP'; }
"++"			{ return 'INC_OP'; }
"--"			{ return 'DEC_OP'; }
"->"			{ return 'PTR_OP'; }
"&&"			{ return 'AND_OP'; }
"||"			{ return 'OR_OP'; }
"<="			{ return 'LE_OP'; }
">="			{ return 'GE_OP'; }
"=="			{ return 'EQ_OP'; }
"!="			{ return 'NE_OP'; }
";"				{ return ';'; }
("{"|"<%")		{ return '{'; }
("}"|"%>")		{ return '}'; }
","				{ return ','; }
":"				{ return ':'; }
"="				{ return '='; }
"("				{ return '('; }
")"				{ return ')'; }
("["|"<:")		{ return '['; }
("]"|":>")		{ return ']'; }
"."				{ return '.'; }
"&"				{ return '&'; }
"!"				{ return '!'; }
"~"				{ return '~'; }
"-"				{ return '-'; }
"+"				{ return '+'; }
"*"				{ return '*'; }
"/"				{ return '/'; }
"%"				{ return '%'; }
"<"				{ return '<'; }
">"				{ return '>'; }
"^"				{ return '^'; }
"|"				{ return '|'; }
"?"				{ return '?'; }

<<EOF>>         { return 'EOF'; }
[ \t\v\n\f]		{ /* ignore whitespace */ }
.				{ /* ignore bad characters */ }


%%
