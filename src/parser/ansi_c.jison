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
	parser.yy.symbols = { types: [], enums: [] };
	parser.yy.last_symbols = { types: [], enums: [] }; // typedefs of last parsing (gets cached)

	function get_declarations(type_specifiers, declarator_list){
		var r = [];
		const type = new Type(type_specifiers); // type will be same regardless of typedef or variable declaration
		for(var decl_init of declarator_list){ // handle multiple same-line declarations (int a, b = 10, c;)
			var declarator = decl_init.declarator;
			var initializer = decl_init.initializer;

			if(type_specifiers.includes("typedef")){ // specifiers include typedef
				r.push(new Typedef(type, declarator));
				// get to the bottom of declarator
				var decl_tmp = declarator;
				while(decl_tmp.kind != DECLTYPE.ID && decl_tmp.child != null){
					decl_tmp = decl_tmp.child;
				}
				parser.yy.symbols.types.push(decl_tmp.identifier.name); // add typedef name to types so lexer can work with them
			}else{
				r.push(new Declaration(type, declarator, initializer)); // basic variable declaration
			}
		}
		
		return r;
	}
%}

%start translation_unit
%%

primary_expression
	: IDENTIFIER { $$ = new Identifier($1); }
	| constant { $$ = $1; }
	| string { $$ = $1; }
	| '(' expression ')' { $$ = $2; }
	| generic_selection
	;

constant
	: I_CONSTANT { $$ = new Literal("i_literal", $1); }
	| F_CONSTANT { $$ = new Literal("f_literal", $1); }
	| ENUMERATION_CONSTANT	//TODO
	;

enumeration_constant
	: IDENTIFIER { $$ = new Identifier($1); }
	;

string
	: STRING_LITERAL { $$ =  new Literal("s_literal", $1); }
	| FUNC_NAME { $$ = $1 }
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
		$$ = [new Type($1)];
	}
	| declaration_specifiers init_declarator_list ';' 
	{
		$$ = get_declarations($1, $2);
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
	: declarator '=' initializer { $$ = { declarator: $1, initializer: $3 }; }
	| declarator { $$ = { declarator: $1, initializer: null }; }
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
	//| COMPLEX skip for now
	//| IMAGINARY	
	//| atomic_type_specifier
	| struct_or_union_specifier { $$ = $1; }
	| enum_specifier { $$ = $1; }
	| TYPEDEF_NAME
	;

struct_or_union_specifier
	: struct_or_union '{' struct_declaration_list '}'
	{ // anonymous struct or union
		$$ = ($1 == "STRUCT") ? new Struct($3) : new Union($3); 
	}
	| struct_or_union IDENTIFIER '{' struct_declaration_list '}' 
	{ // struct variable initialization and struct definition 
		$$ = ($1 == "STRUCT") ? new Struct($4, new Identifier($2)) : new Union($4, new Identifier($2)); 
	}
	| struct_or_union IDENTIFIER 
	{ // struct variable declaration
		$$ = ($1 == "STRUCT") ? new Struct(null, new Identifier($2)) : new Union(null, new Identifier($2)); 
	}
	;

struct_or_union
	: STRUCT { $$ = $1; }
	| UNION { $$ = $1; }
	;

struct_declaration_list
	: struct_declaration { $$ = Array.isArray($1) ? $1 : [$1]; } // fixes nested arrays
	| struct_declaration_list struct_declaration { $$ = Array.isArray($2) ? [...$1, ...$2] : [...$1, $2]; }
	;

struct_declaration
	: specifier_qualifier_list ';' 
	{ 
		$$ = new Declaration(new Type($1), new Unnamed(), null); 
	}
	| specifier_qualifier_list struct_declarator_list ';' 
	{ 
		$$ = [];
		for(var decl_init of $2){
			$$.push(new Declaration(new Type($1), decl_init.declarator, decl_init.initializer));
		}
		
	}
	| static_assert_declaration // skip for now
	;

specifier_qualifier_list
	: type_specifier specifier_qualifier_list { $$ = [$1, ...$2]; }
	| type_specifier { $$ = [$1]; }
	| type_qualifier specifier_qualifier_list { $$ = [$1, ...$2]; }
	| type_qualifier { $$ = [$1]; }
	;

struct_declarator_list
	: struct_declarator // single declaration per line
	{
		$$ = [$1];
	}
	| struct_declarator_list ',' struct_declarator 
	{ 
		$$ = [...$1, $3];
	}
	;

struct_declarator
	: ':' constant_expression { $$ = { declarator: new Unnamed(), initializer: $2 }; } 
	| declarator ':' constant_expression { $$ = { declarator: $1, initializer: $3 }; }
	| declarator { $$ = { declarator: $1, initializer: null }; }
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

/*atomic_type_specifier // skip for now
	: ATOMIC '(' type_name ')'
	;*/

type_qualifier
	: CONST
	| RESTRICT
	| VOLATILE
	//| ATOMIC
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
	: pointer direct_declarator { $$ = new Declarator(DECLTYPE.PTR, $2, $1); } //TODO get more data about pointer ($1)
	| direct_declarator { $$ = $1; } // always returns typeof Declarator
	;

direct_declarator // must always return typeof Declarator
	: IDENTIFIER { $$ = new Declarator(DECLTYPE.ID, null, new Identifier($1)); }
	| '(' declarator ')' { $$ = $2; }
	| direct_declarator '[' ']' { $$ = new Declarator(DECLTYPE.ARR, $1); }
	/* NOT SUPPORTING VARIABLE LENGTH ARRAYS FOR NOW | direct_declarator '[' '*' ']' { $$ = { ...$1, declarator_type: "array", size: null }; } // fix these later
	| direct_declarator '[' STATIC type_qualifier_list assignment_expression ']' { $$ = { ...$1, declarator_type: "array"}; }
	| direct_declarator '[' STATIC assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list '*' ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list STATIC assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list ']' { $$ = $1; } !NOT SUPPORTING VARIABLE LENGTH ARRAYS FOR NOW */ 
	| direct_declarator '[' assignment_expression ']' { $$ = new Declarator(DECLTYPE.ARR, $1); } // TODO return size of array
	| direct_declarator '(' parameter_type_list ')' { $$ = new Declarator(DECLTYPE.FNC, $1); } //TODO function parameters
	| direct_declarator '(' ')' { $$ = new Declarator(DECLTYPE.FNC, $1.identifier); } //TODO function call without parameters
	| direct_declarator '(' identifier_list ')' { $$ = new Declarator(DECLTYPE.FNC, $1); } // function arguments? I guess
	;

pointer
	: '*' type_qualifier_list pointer { $$ = new Pointer($3, $2); }
	| '*' type_qualifier_list { $$ = new Pointer(null, $2); } //TODO add qualifiers to the pointer
	| '*' pointer { $$ = new Pointer($2); }
	| '*' { $$ = new Pointer(null); }
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
	: '{' initializer_list '}' { $$ = { type: "array_initializer", values: $2 }; }
	| '{' initializer_list ',' '}' { $$ = { type: "array_initializer", values: $2 }; }
	| assignment_expression { $$ = $1; }
	;

initializer_list
	: designation initializer
	| initializer { $$ = [$1]; }
	| initializer_list ',' designation initializer
	| initializer_list ',' initializer { $$ = [...$1, $3]; }
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
	| '{'  block_item_list '}' { $$ = $2; }
	;

block_item_list
	: block_item { $$ = $1; }
	| block_item_list block_item { $$ = [...$1, ...$2]; }
	;

block_item
	: declaration { $$ = $1; } // V-- declaration always returns array (because there could be multiple declarations on single line)
	| statement { $$ = [$1]; } // TODO: check this later, I don't like it returning array (it was needed because of declaration)
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
	: translation_unit external_declaration EOF { parser.yy.last_symbols = parser.yy.symbols; return Array.isArray($2) ? [...$1, ...$2] : [...$1, $2]; }
	| external_declaration EOF { parser.yy.last_symbols = parser.yy.symbols; return Array.isArray($1) ? $1 : [$1]; }
	| translation_unit external_declaration { $$ = Array.isArray($2) ? [...$1, ...$2] : [...$1, $2]; }
	| external_declaration { $$ = Array.isArray($1) ? $1 : [$1]; }
	;

external_declaration
	: function_definition { $$ = $1; } // function definition // returns single instance of class Func
	| declaration { $$ = $1; } // global declaration // always returns array
	;

function_definition
	: declaration_specifiers declarator compound_statement { $$ = new Func($2, $1, new CStmt($3)); }
 	//| declaration_specifiers declarator declaration_list compound_statement 
	/* ignore K&R type function declaration for now (https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Old_002dStyle-Function-Definitions.html) */
	;

declaration_list
	: declaration
	| declaration_list declaration
	;
