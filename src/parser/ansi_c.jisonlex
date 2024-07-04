O   [0-7]
D   [0-9]
NZ  [1-9]
L   [a-zA-Z_]
A   [a-zA-Z_0-9]
H   [a-fA-F0-9]
HP  ("0"[xX])
E   ([Ee][+-]?{D}+)
P   ([Pp][+-]?{D}+)
FS  [fFlL]
IS  [uUlL]*
CP 	[uUL] 
SP  ("u8"|[uUL])
ES  (\\(['"?\abfnrtv]|[0-7]{1,3}|"x"[a-fA-F0-9]+))
WS  [\s\t\v\n\f]

%{
//#include <stdio.h>
//#include "y.tab.h"

void count();
%}

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

"auto"			{ count(); return 'AUTO'; }
"break"			{ count(); return 'BREAK'; }
"case"			{ count(); return 'CASE'; }
"char"			{ count(); return 'CHAR'; }
"const"			{ count(); return 'CONST'; }
"continue"		{ count(); return 'CONTINUE'; }
"default"		{ count(); return 'DEFAULT'; }
"do"			{ count(); return 'DO'; }
"double"		{ count(); return 'DOUBLE'; }
"else"			{ count(); return 'ELSE'; }
"enum"			{ count(); return 'ENUM'; }
"extern"		{ count(); return 'EXTERN'; }
"float"			{ count(); return 'FLOAT'; }
"for"			{ count(); return 'FOR'; }
"goto"			{ count(); return 'GOTO'; }
"if"			{ count(); return 'IF'; }
"int"			{ count(); return 'INT'; }
"long"			{ count(); return 'LONG'; }
"register"		{ count(); return 'REGISTER'; }
"return"		{ count(); return 'RETURN'; }
"short"			{ count(); return 'SHORT'; }
"signed"		{ count(); return 'SIGNED'; }
"sizeof"		{ count(); return 'SIZEOF'; }
"static"		{ count(); return 'STATIC'; }
"struct"		{ count(); return 'STRUCT'; }
"switch"		{ count(); return 'SWITCH'; }
"typedef"		{ count(); return 'TYPEDEF'; }
"union"			{ count(); return 'UNION'; }
"unsigned"		{ count(); return 'UNSIGNED'; }
"void"			{ count(); return 'VOID'; }
"volatile"		{ count(); return 'VOLATILE'; }
"while"			{ count(); return 'WHILE'; }
"_Alignas"		{ return 'ALIGNAS'; }
"_Alignof"      	{ return 'ALIGNOF'; }
"_Atomic"       	{ return 'ATOMIC'; }
"_Bool"         	{ return 'BOOL'; }
"_Complex"      	{ return 'COMPLEX'; }
"_Generic"      	{ return 'GENERIC'; }
"_Imaginary"    	{ return 'IMAGINARY'; }
"_Noreturn"     	{ return 'NORETURN'; }
"_Static_assert" 	{ return 'STATIC_ASSERT'; }
"_Thread_local"  	{ return 'THREAD_LOCAL'; }
"__func__"       	{ return 'FUNC_NAME'; }

{L}({L}|{D})*		{ count(); return check_type(yytext); }

{HP}{H}+{IS}?					{ return 'I_CONSTANT'; }
{NZ}{D}*{IS}?					{ return 'I_CONSTANT'; }
"0"{O}*{IS}?					{ return 'I_CONSTANT'; }
{CP}?"'"([^'\\\n]|{ES})+"'"		{ return 'I_CONSTANT'; }

{D}+{E}{FS}?					{ return 'F_CONSTANT'; }
{D}*"."{D}+{E}?{FS}?			{ return 'F_CONSTANT'; }
{D}+"."{E}?{FS}?				{ return 'F_CONSTANT'; }
{HP}{H}+{P}{FS}?				{ return 'F_CONSTANT'; }
{HP}{H}*"."{H}+{P}{FS}?			{ return 'F_CONSTANT'; }
{HP}{H}+"."{P}{FS}?				{ return 'F_CONSTANT'; }

({SP}?\"([^"\\\n]|{ES})*\"{WS}*)+	{ return 'STRING_LITERAL'; }

"..."			{ count(); return 'ELLIPSIS'; }
">>="			{ count(); return 'RIGHT_ASSIGN'; }
"<<="			{ count(); return 'LEFT_ASSIGN'; }
"+="			{ count(); return 'ADD_ASSIGN'; }
"-="			{ count(); return 'SUB_ASSIGN'; }
"*="			{ count(); return 'MUL_ASSIGN'; }
"/="			{ count(); return 'DIV_ASSIGN'; }
"%="			{ count(); return 'MOD_ASSIGN'; }
"&="			{ count(); return 'AND_ASSIGN'; }
"^="			{ count(); return 'XOR_ASSIGN'; }
"|="			{ count(); return 'OR_ASSIGN'; }
">>"			{ count(); return 'RIGHT_OP'; }
"<<"			{ count(); return 'LEFT_OP'; }
"++"			{ count(); return 'INC_OP'; }
"--"			{ count(); return 'DEC_OP'; }
"->"			{ count(); return 'PTR_OP'; }
"&&"			{ count(); return 'AND_OP'; }
"||"			{ count(); return 'OR_OP'; }
"<="			{ count(); return 'LE_OP'; }
">="			{ count(); return 'GE_OP'; }
"=="			{ count(); return 'EQ_OP'; }
"!="			{ count(); return 'NE_OP'; }
";"			{ count(); return ';'; }
("{"|"<%")		{ count(); return '{'; }
("}"|"%>")		%{ count(); return '}'; %}
","			{ count(); return ','; }
":"			{ count(); return ':'; }
"="			{ count(); return '='; }
"("			{ count(); return '('; }
")"			{ count(); return ')'; }
("["|"<:")		{ count(); return '['; }
("]"|":>")		{ count(); return ']'; }
"."			{ count(); return '.'; }
"&"			{ count(); return '&'; }
"!"			{ count(); return '!'; }
"~"			{ count(); return '~'; }
"-"			{ count(); return '-'; }
"+"			{ count(); return '+'; }
"*"			{ count(); return '*'; }
"/"			{ count(); return '/'; }
"%"			{ count(); return '%'; }
"<"			{ count(); return '<'; }
">"			{ count(); return '>'; }
"^"			{ count(); return '^'; }
"|"			{ count(); return '|'; }
"?"			{ count(); return '?'; }

[ \t\v\n\f]		{ count(); }
.			{ /* ignore bad characters */ }

%%

function check_type(yytext){
	return 'IDENTIFIER'; // TODO add sym table
}

function comment(){
	return;
}

function count(){
	return;
}
