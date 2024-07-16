%token IDENTIFIER I_CONSTANT F_CONSTANT STRING_LITERAL FUNC_NAME SIZEOF
%token PTR_OP INC_OP DEC_OP LEFT_OP RIGHT_OP LE_OP GE_OP EQ_OP NE_OP
%token AND_OP OR_OP MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN ADD_ASSIGN
%token SUB_ASSIGN LEFT_ASSIGN RIGHT_ASSIGN AND_ASSIGN
%token XOR_ASSIGN OR_ASSIGN
%token TYPEDEF_NAME ENUMERATION_CONSTANT

%token TYPEDEF EXTERN STATIC AUTO REGISTER INLINE
%token CONST RESTRICT VOLATILE
%token BOOL CHAR SHORT INT LONG SIGNED UNSIGNED FLOAT DOUBLE VOID
%token COMPLEX IMAGINARY 
%token STRUCT UNION ENUM ELLIPSIS

%token CASE DEFAULT IF ELSE SWITCH WHILE DO FOR GOTO CONTINUE BREAK RETURN

%token ALIGNAS ALIGNOF ATOMIC GENERIC NORETURN STATIC_ASSERT THREAD_LOCAL

%{
	parser.yy.types = []; // typedef types
	parser.yy.last_types = []; // typedefs of last parsing (get cached)
%}

%start translation_unit
%%

primary_expression
	: IDENTIFIER { $$ = { type: "identifier", value: $1 }; }
	| constant { $$ = $1; }
	| string { $$ = $1; }
	| '(' expression ')' { $$ = $2; }
	| generic_selection
	;

constant
	: I_CONSTANT { $$ = { type: "i_constant", value: $1 }; }
	| F_CONSTANT { $$ = { type: "f_constant", value: $1 }; }
	| ENUMERATION_CONSTANT	
	;

enumeration_constant
	: IDENTIFIER
	;

string
	: STRING_LITERAL { $$ = { type: "string_constant", value: $1 }; }
	| FUNC_NAME { $$ = { type: "func_name", value: $1 }; }
	;

generic_selection
	: GENERIC '(' assignment_expression ',' generic_assoc_list ')'
	;

generic_assoc_list
	: generic_association
	| generic_assoc_list ',' generic_association
	;

generic_association
	: type_name ':' assignment_expression
	| DEFAULT ':' assignment_expression
	;

postfix_expression
	: primary_expression
	| postfix_expression '[' expression ']'
	| postfix_expression '(' ')'
	| postfix_expression '(' argument_expression_list ')'
	| postfix_expression '.' IDENTIFIER
	| postfix_expression PTR_OP IDENTIFIER
	| postfix_expression INC_OP
	| postfix_expression DEC_OP
	| '(' type_name ')' '{' initializer_list '}'
	| '(' type_name ')' '{' initializer_list ',' '}'
	;

argument_expression_list
	: assignment_expression
	| argument_expression_list ',' assignment_expression
	;

unary_expression
	: postfix_expression
	| INC_OP unary_expression
	| DEC_OP unary_expression
	| unary_operator cast_expression
	| SIZEOF unary_expression
	| SIZEOF '(' type_name ')'
	| ALIGNOF '(' type_name ')'
	;

unary_operator
	: '&'
	| '*'
	| '+'
	| '-'
	| '~'
	| '!'
	;

cast_expression
	: unary_expression
	| '(' type_name ')' cast_expression
	;

multiplicative_expression
	: cast_expression
	| multiplicative_expression '*' cast_expression
	| multiplicative_expression '/' cast_expression
	| multiplicative_expression '%' cast_expression
	;

additive_expression
	: multiplicative_expression
	| additive_expression '+' multiplicative_expression
	| additive_expression '-' multiplicative_expression
	;

shift_expression
	: additive_expression
	| shift_expression LEFT_OP additive_expression
	| shift_expression RIGHT_OP additive_expression
	;

relational_expression
	: shift_expression
	| relational_expression '<' shift_expression
	| relational_expression '>' shift_expression
	| relational_expression LE_OP shift_expression
	| relational_expression GE_OP shift_expression
	;

equality_expression
	: relational_expression
	| equality_expression EQ_OP relational_expression
	| equality_expression NE_OP relational_expression
	;

and_expression
	: equality_expression
	| and_expression '&' equality_expression
	;

exclusive_or_expression
	: and_expression
	| exclusive_or_expression '^' and_expression
	;

inclusive_or_expression
	: exclusive_or_expression
	| inclusive_or_expression '|' exclusive_or_expression
	;

logical_and_expression
	: inclusive_or_expression
	| logical_and_expression AND_OP inclusive_or_expression
	;

logical_or_expression
	: logical_and_expression
	| logical_or_expression OR_OP logical_and_expression
	;

conditional_expression
	: logical_or_expression
	| logical_or_expression '?' expression ':' conditional_expression
	;

assignment_expression
	: conditional_expression
	| unary_expression assignment_operator assignment_expression
	;

assignment_operator
	: '='
	| MUL_ASSIGN 
	| DIV_ASSIGN
	| MOD_ASSIGN
	| ADD_ASSIGN
	| SUB_ASSIGN
	| LEFT_ASSIGN
	| RIGHT_ASSIGN
	| AND_ASSIGN
	| XOR_ASSIGN
	| OR_ASSIGN
	;

expression
	: assignment_expression
	| expression ',' assignment_expression
	;

constant_expression
	: conditional_expression { $$ = $1; }
	;

declaration
	: declaration_specifiers ';'
	{

	}
	| declaration_specifiers init_declarator_list ';' 
	{
		$$ = [];
		for(var declarator of $2){
			if($1.includes("typedef")){
				$$.push({
					statement_type: "typedef", type: 
					$1.filter(function (without) {
						return without !== "typedef"; // remove "typedef" as that is not needed in the types
					}), 
					declarator: declarator 
				});
				parser.yy.types.push(declarator.value);
			}else{
				$$.push({statement_type: "declaration", type: $1, declarator: declarator});
			}
		}
	}
	| static_assert_declaration
	;

declaration_specifiers
	: storage_class_specifier declaration_specifiers { $$ = [$1, ...$2]; }
	| storage_class_specifier { $$ = [$1]; }
	| type_specifier declaration_specifiers { $$ = [$1, ...$2]; }
	| type_specifier { $$ = [$1]; }
	| type_qualifier declaration_specifiers { $$ = [$1, ...$2]; }
	| type_qualifier { $$ = [$1]; }
	| function_specifier declaration_specifiers { $$ = [$1, ...$2]; }
	| function_specifier { $$ = [$1]; } 
	| alignment_specifier declaration_specifiers { $$ = [$1, ...$2]; }
	| alignment_specifier { $$ = [$1]; }
	;

init_declarator_list
	: init_declarator { $$ = [$1]; }
	| init_declarator_list ',' init_declarator { $$ = [...$1, $3]; }
	;

init_declarator
	: declarator '=' initializer { $$ = { ...$1, initializer: $3 }; }
	| declarator { $$ = { ...$1, initializer: null }; }
	;

storage_class_specifier
	: TYPEDEF
	| EXTERN
	| STATIC
	| THREAD_LOCAL
	| AUTO
	| REGISTER
	;

type_specifier
	: VOID
	| CHAR
	| SHORT
	| INT
	| LONG
	| FLOAT
	| DOUBLE
	| SIGNED
	| UNSIGNED
	| BOOL
	| COMPLEX
	| IMAGINARY	
	| atomic_type_specifier
	| struct_or_union_specifier
	| enum_specifier
	| TYPEDEF_NAME
	;

struct_or_union_specifier
	: struct_or_union '{' struct_declaration_list '}'
	| struct_or_union IDENTIFIER '{' struct_declaration_list '}'
	| struct_or_union IDENTIFIER
	;

struct_or_union
	: STRUCT
	| UNION
	;

struct_declaration_list
	: struct_declaration
	| struct_declaration_list struct_declaration
	;

struct_declaration
	: specifier_qualifier_list ';'
	| specifier_qualifier_list struct_declarator_list ';'
	| static_assert_declaration
	;

specifier_qualifier_list
	: type_specifier specifier_qualifier_list
	| type_specifier
	| type_qualifier specifier_qualifier_list
	| type_qualifier
	;

struct_declarator_list
	: struct_declarator
	| struct_declarator_list ',' struct_declarator
	;

struct_declarator
	: ':' constant_expression
	| declarator ':' constant_expression
	| declarator
	;

enum_specifier
	: ENUM '{' enumerator_list '}'
	| ENUM '{' enumerator_list ',' '}'
	| ENUM IDENTIFIER '{' enumerator_list '}'
	| ENUM IDENTIFIER '{' enumerator_list ',' '}'
	| ENUM IDENTIFIER
	;

enumerator_list
	: enumerator
	| enumerator_list ',' enumerator
	;

enumerator
	: enumeration_constant '=' constant_expression
	| enumeration_constant
	;

atomic_type_specifier
	: ATOMIC '(' type_name ')'
	;

type_qualifier
	: CONST
	| RESTRICT
	| VOLATILE
	| ATOMIC
	;

function_specifier
	: INLINE
	| NORETURN
	;

alignment_specifier
	: ALIGNAS '(' type_name ')'
	| ALIGNAS '(' constant_expression ')'
	;

declarator
	: pointer direct_declarator { $$ = $2; } //todo add pointer definition to the json structure
	| direct_declarator { $$ = $1; }
	;

direct_declarator
	: IDENTIFIER { $$ = { type: "identifier", value: $1 }; }
	| '(' declarator ')' { $$ = $2; }
	| direct_declarator '[' ']' { $$ = { ...$1, declarator_type: "array", array: { size: null } }; }
	/*| direct_declarator '[' '*' ']' { $$ = { ...$1, declarator_type: "array", size: null }; } // fix these later
	| direct_declarator '[' STATIC type_qualifier_list assignment_expression ']' { $$ = { ...$1, declarator_type: "array"}; }
	| direct_declarator '[' STATIC assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list '*' ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list STATIC assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list ']' { $$ = $1; } NOT SUPPORTING VARIABLE LENGTH ARRAYS FOR NOW */ 
	| direct_declarator '[' assignment_expression ']' { $$ = { ...$1, declarator_type: "array", array: { size: $3 } }; }
	| direct_declarator '(' parameter_type_list ')' { $$ = $1; }
	| direct_declarator '(' ')' { $$ = $1; }
	| direct_declarator '(' identifier_list ')' { $$ = $1; }
	;

pointer
	: '*' type_qualifier_list pointer
	| '*' type_qualifier_list
	| '*' pointer
	| '*'
	;

type_qualifier_list
	: type_qualifier { $$ = [$1]; }
	| type_qualifier_list type_qualifier { $$ = [...$1, $2]; }
	;


parameter_type_list
	: parameter_list ',' ELLIPSIS
	| parameter_list
	;

parameter_list
	: parameter_declaration
	| parameter_list ',' parameter_declaration
	;

parameter_declaration
	: declaration_specifiers declarator
	| declaration_specifiers abstract_declarator
	| declaration_specifiers
	;

identifier_list
	: IDENTIFIER
	| identifier_list ',' IDENTIFIER
	;

type_name
	: specifier_qualifier_list abstract_declarator
	| specifier_qualifier_list
	;

abstract_declarator
	: pointer direct_abstract_declarator
	| pointer
	| direct_abstract_declarator
	;

direct_abstract_declarator
	: '(' abstract_declarator ')'
	| '[' ']'
	| '[' '*' ']'
	| '[' STATIC type_qualifier_list assignment_expression ']'
	| '[' STATIC assignment_expression ']'
	| '[' type_qualifier_list STATIC assignment_expression ']'
	| '[' type_qualifier_list assignment_expression ']'
	| '[' type_qualifier_list ']'
	| '[' assignment_expression ']'
	| direct_abstract_declarator '[' ']'
	| direct_abstract_declarator '[' '*' ']'
	| direct_abstract_declarator '[' STATIC type_qualifier_list assignment_expression ']'
	| direct_abstract_declarator '[' STATIC assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list STATIC assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list ']'
	| direct_abstract_declarator '[' assignment_expression ']'
	| '(' ')'
	| '(' parameter_type_list ')'
	| direct_abstract_declarator '(' ')'
	| direct_abstract_declarator '(' parameter_type_list ')'
	;

initializer
	: '{' initializer_list '}' { $$ = $2; }
	| '{' initializer_list ',' '}' { $$ = $2; }
	| assignment_expression { $$ = $1; }
	;

initializer_list
	: designation initializer
	| initializer
	| initializer_list ',' designation initializer
	| initializer_list ',' initializer
	;

designation
	: designator_list '='
	;

designator_list
	: designator
	| designator_list designator
	;

designator
	: '[' constant_expression ']'
	| '.' IDENTIFIER
	;

static_assert_declaration
	: STATIC_ASSERT '(' constant_expression ',' STRING_LITERAL ')' ';'
	;

statement
	: labeled_statement
	| compound_statement
	| expression_statement
	| selection_statement
	| iteration_statement
	| jump_statement
	;

labeled_statement
	: IDENTIFIER ':' statement
	| CASE constant_expression ':' statement
	| DEFAULT ':' statement
	;

compound_statement
	: '{' '}'
	| '{'  block_item_list '}' { $$ = $2 }
	;

block_item_list
	: block_item { $$ = [$1]; }
	| block_item_list block_item { $$ = [...$1, $2]; }
	;

block_item
	: declaration
	| statement
	;

expression_statement
	: ';'
	| expression ';'
	;

selection_statement
	: IF '(' expression ')' statement ELSE statement
	| IF '(' expression ')' statement
	| SWITCH '(' expression ')' statement
	;

iteration_statement
	: WHILE '(' expression ')' statement
	| DO statement WHILE '(' expression ')' ';'
	| FOR '(' expression_statement expression_statement ')' statement
	| FOR '(' expression_statement expression_statement expression ')' statement
	| FOR '(' declaration expression_statement ')' statement
	| FOR '(' declaration expression_statement expression ')' statement
	;

jump_statement
	: GOTO IDENTIFIER ';'
	| CONTINUE ';'
	| BREAK ';'
	| RETURN ';'
	| RETURN expression ';'
	;

translation_unit
	: translation_unit external_declaration EOF { parser.yy.last_types = parser.yy.types; parser.yy.types = []; return [...$1, $2]; } // clear types because they get cached by JS
	| external_declaration EOF { parser.yy.last_types = parser.yy.types; parser.yy.types = []; return [$1]; } // clear types because they get cached by JS
	| translation_unit external_declaration { $$ = [...$1, $2]; }
	| external_declaration { $$ = [$1]; }
	;

external_declaration
	: function_definition { $$ = { statement_type: "function_definition", function_definition: $1 }; } // function definition
	| declaration { $$ = { statement_type: "declaration", declaration: $1 }; } // global declaration
	;

function_definition
	: declaration_specifiers declarator compound_statement { $$ = { return_type: $1, declarator: $2, body: $3 }; }
 	| declaration_specifiers declarator declaration_list compound_statement 
	/* ignore K&R type function declaration for now (https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Old_002dStyle-Function-Definitions.html) */
	;

declaration_list
	: declaration
	| declaration_list declaration
	;
