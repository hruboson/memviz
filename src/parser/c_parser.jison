/**
 * @file Parser grammar (source: https://www.quut.com/c/ANSI-C-grammar-y-2011.html)
 * @author jutta@pobox.com
 * @author DAGwyn@aol.com
 * @author Ondřej Hruboš (modification)
 */

%token IDENTIFIER I_CONSTANT F_CONSTANT STRING_LITERAL FUNC_NAME SIZEOF
%token PTR_OP INC_OP DEC_OP LEFT_OP RIGHT_OP LE_OP GE_OP EQ_OP NE_OP
%token AND_OP OR_OP MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN ADD_ASSIGN
%token SUB_ASSIGN LEFT_ASSIGN RIGHT_ASSIGN AND_ASSIGN
%token XOR_ASSIGN OR_ASSIGN
%token TYPEDEF_NAME ENUMERATION_CONSTANT

%token TYPEDEF /*NOT SUPPORTED: EXTERN STATIC AUTO REGISTER INLINE*/

/*NOT SUPPORTED-------------------------------------------
%token CONST RESTRICT VOLATILE
---------------------------------------------------------*/

%token BOOL CHAR SHORT INT LONG SIGNED UNSIGNED FLOAT DOUBLE VOID

/*NOT SUPPORTED-------------------------------------------
%token COMPLEX IMAGINARY 
---------------------------------------------------------*/
%token STRUCT UNION ENUM ELLIPSIS

%token CASE DEFAULT IF ELSE SWITCH WHILE DO FOR GOTO CONTINUE BREAK RETURN

/*NOT SUPPORTED-------------------------------------------
%token ALIGNAS ALIGNOF ATOMIC GENERIC NORETURN STATIC_ASSERT THREAD_LOCAL
---------------------------------------------------------*/

%{
	
	parser.yy.symbols = { types: [], enums: [] };
	parser.yy.lastSymbols = { types: [], enums: [] }; // typedefs of last parsing (gets cached)
	parser.yy.userTypesMap = new Map();

	function getDeclarations(typeSpecifiers, declaratorList, loc){
		var r = [];
		const type = new Type(typeSpecifiers, loc); // type will be same regardless of typedef or variable declaration
		for(var declInit of declaratorList){ // handle multiple same-line declarations (int a, b = 10, c;)
			var declarator = declInit.declarator;
			var initializer = declInit.initializer;

			if(typeSpecifiers.includes("typedef")){ // specifiers include typedef
				r.push(new Typedef(type, declarator, loc));
				// get to the bottom of declarator
				var declTmp = declarator;
				while(declTmp.kind != DECLTYPE.ID && declTmp.child != null){
					declTmp = declTmp.child;
				}
				parser.yy.symbols.types.push(declTmp.identifier.name); // add typedef name to types so lexer can work with them
				if(!parser.yy.userTypesMap) parser.yy.userTypesMap = new Map();
				parser.yy.userTypesMap.set(declTmp.identifier.name, new Typedef(type, declarator, loc));
				//! move this to Typedef constructor
			}else{
				r.push(new Declaration(type, declarator, initializer, loc)); // basic variable declaration
			}
		}
		
		return r;
	}
%}

%start translation_unit
%%

primary_expression
	: IDENTIFIER { $$ = new Identifier($1, @$); }
	| constant { $$ = $1; }
	| string { $$ = $1; }
	| '(' expression ')' { $$ = $2; } // this is the devil, it is necessary to check every expression for array length
	/*NOT SUPPORTED-------------------------------------------
	| generic_selection
	--------------------------------------------------------*/
	;

constant
	: I_CONSTANT { $$ = new CExpr("i_constant", $1, @$); }
	| F_CONSTANT { $$ = new CExpr("f_constant", $1, @$); }
	| ENUMERATION_CONSTANT { $$ = new Identifier($1, @$); }	
	;

enumeration_constant
	: IDENTIFIER { $$ = new Identifier($1, @$); }
	;

string
	: STRING_LITERAL { $$ =  new CExpr("s_literal", $1, @$); }
	| FUNC_NAME { $$ = $1 }
	;

/*NOT SUPPORTED-------------------------------------------
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
--------------------------------------------------------*/

postfix_expression
	: primary_expression { $$ = $1; }
	| postfix_expression '[' expression ']' { $$ = new SubscriptExpr($1, $3, @$); } // There should always be check on whether $3 is array (in semantic, intepreter, ...), and if yes, its a warning from compiler
	| postfix_expression '(' ')'
	{ 
		$$ = new FncCallExpr($1, [], @$);
	}
	| postfix_expression '(' argument_expression_list ')'
	{
		$$ = new FncCallExpr($1, $3, @$);
	}
	| postfix_expression '.' IDENTIFIER { $$ = new MemberAccessExpr($1, $3, @$); }
	| postfix_expression PTR_OP IDENTIFIER { $$ = new PtrMemberAccessExpr($1, $3, @$); }
	| postfix_expression INC_OP { $$ = new UExpr($1, $2, @$); } //! this might need to know that it's postfix
	| postfix_expression DEC_OP { $$ = new UExpr($1, $2, @$); }
	/*NOT SUPPORTED-------------------------------------------
	// Compound literals
	| '(' type_name ')' '{' initializer_list '}'
	| '(' type_name ')' '{' initializer_list ',' '}'
	--------------------------------------------------------*/
	;

argument_expression_list
	: assignment_expression { $$ = [$1]; }
	| argument_expression_list ',' assignment_expression { $$ = [...$1, $3]; }
	;

unary_expression
	: postfix_expression { $$ = $1; }
	| INC_OP unary_expression
	{
		$$ = new UExpr($2, $1, @$);
	}
	| DEC_OP unary_expression
	{
		$$ = new UExpr($2, $1, @$);
	}
	| unary_operator cast_expression
	{
		$$ = new UExpr($2, $1, @$);
	}
	| SIZEOF unary_expression
	{
		$$ = new SizeOfExpr($2, $1, @$);
	}
	| SIZEOF '(' type_name ')'
	{
		$$ = new SizeOfExpr($3, $1, @$);
	}
	/*NOT SUPPORTED-------------------------------------------
	//| ALIGNOF '(' type_name ')'
	--------------------------------------------------------*/
	;

unary_operator
	: '&' { $$ = $1; }
	| '*' { $$ = $1; }
	| '+' { $$ = $1; }
	| '-' { $$ = $1; }
	| '~' { $$ = $1; }
	| '!' { $$ = $1; }
	;

cast_expression
	: unary_expression { $$ = $1; }
	| '(' type_name ')' cast_expression { $$ = new CastExpr($2, $4, @$); }
	;

multiplicative_expression
	: cast_expression { $$ = $1; }
	| multiplicative_expression '*' cast_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	| multiplicative_expression '/' cast_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	| multiplicative_expression '%' cast_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	;

additive_expression
	: multiplicative_expression { $$ = $1; }
	| additive_expression '+' multiplicative_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	| additive_expression '-' multiplicative_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	;

shift_expression
	: additive_expression { $$ = $1; }
	| shift_expression LEFT_OP additive_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	| shift_expression RIGHT_OP additive_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	;

relational_expression
	: shift_expression { $$ = $1; }
	| relational_expression '<' shift_expression { $$ = new BCompExpr($1, $2, $3, @$); }
	| relational_expression '>' shift_expression { $$ = new BCompExpr($1, $2, $3, @$); }
	| relational_expression LE_OP shift_expression { $$ = new BCompExpr($1, $2, $3, @$); }
	| relational_expression GE_OP shift_expression { $$ = new BCompExpr($1, $2, $3, @$); }
	;

equality_expression
	: relational_expression { $$ = $1; }
	| equality_expression EQ_OP relational_expression { $$ = new BCompExpr($1, $2, $3, @$); }
	| equality_expression NE_OP relational_expression { $$ = new BCompExpr($1, $2, $3, @$); }
	;

and_expression
	: equality_expression { $$ = $1; }
	| and_expression '&' equality_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	;

exclusive_or_expression
	: and_expression { $$ = $1; }
	| exclusive_or_expression '^' and_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	;

inclusive_or_expression
	: exclusive_or_expression { $$ = $1; }
	| inclusive_or_expression '|' exclusive_or_expression { $$ = new BArithExpr($1, $2, $3, @$); }
	;

logical_and_expression
	: inclusive_or_expression { $$ = $1; }
	| logical_and_expression AND_OP inclusive_or_expression { $$ = new BLogicExpr($1, $2, $3, @$); }
	;

logical_or_expression
	: logical_and_expression { $$ = $1; }
	| logical_or_expression OR_OP logical_and_expression { $$ = new BLogicExpr($1, $2, $3, @$); }
	;

conditional_expression
	: logical_or_expression { $$ = $1; }
	| logical_or_expression '?' expression ':' conditional_expression { $$ = new CondExpr($1, $3, $5, @$); }
	;

assignment_expression
	: conditional_expression { $$ = $1; }
	| unary_expression assignment_operator assignment_expression { $$ = new BAssignExpr($1, $2, $3, @$); }
	;

assignment_operator
	: '=' { $$ = $1; }
	| MUL_ASSIGN { $$ = $1; }
	| DIV_ASSIGN { $$ = $1; }
	| MOD_ASSIGN { $$ = $1; }
	| ADD_ASSIGN { $$ = $1; }
	| SUB_ASSIGN { $$ = $1; }
	| LEFT_ASSIGN { $$ = $1; }
	| RIGHT_ASSIGN { $$ = $1; }
	| AND_ASSIGN { $$ = $1; }
	| XOR_ASSIGN { $$ = $1; }
	| OR_ASSIGN { $$ = $1; }
	;

expression
	: assignment_expression { $$ = [$1]; }
	| expression ',' assignment_expression { $$ = [...$1, $3]; }
	;

constant_expression
	: conditional_expression { $$ = $1; }
	;

declaration
	: declaration_specifiers ';'
	{
		$$ = isclass($1[0], "Enum") ? $1[0] : new Type($1, @$);
	}
	| declaration_specifiers init_declarator_list ';' 
	{
		$$ = getDeclarations($1, $2, @$);
	}
	/*NOT SUPPORTED-------------------------------------------
	| static_assert_declaration
	--------------------------------------------------------*/
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
	: declarator '=' initializer { $$ = { declarator: $1, initializer: $3 }; } // helper structure, will be discarded further up 
	| declarator { $$ = { declarator: $1, initializer: null }; } // same helper structure
	;

storage_class_specifier
	: TYPEDEF
	/*NOT SUPPORTED-------------------------------------------
	| EXTERN
	| STATIC
	| THREAD_LOCAL
	| AUTO
	| REGISTER
	--------------------------------------------------------*/
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
	/*NOT SUPPORTED-------------------------------------------
	| COMPLEX
	| IMAGINARY	
	| atomic_type_specifier
	--------------------------------------------------------*/
	| struct_or_union_specifier { $$ = $1; }
	| enum_specifier { $$ = $1; }
	| TYPEDEF_NAME
	;

struct_or_union_specifier
	: struct_or_union '{' struct_declaration_list '}'
	{ // anonymous struct or union
		$$ = ($1 == "STRUCT") ? new Struct($3, new Unnamed(@$), @$) : new Union($3, new Unnamed(@$), @$); 
	}
	| struct_or_union IDENTIFIER '{' struct_declaration_list '}' 
	{ // struct variable initialization and struct definition 
		$$ = ($1 == "STRUCT") ? new Struct($4, new Tagname($2, @$), @$) : new Union($4, new Tagname($2, @$), @$); 
	}
	| struct_or_union IDENTIFIER 
	{ // struct variable declaration
		$$ = ($1 == "STRUCT") ? new Struct(null, new Tagname($2, @$), @$) : new Union(null, new Tagname($2, @$), @$); 
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
		$$ = new Type($1, @$); 
	}
	| specifier_qualifier_list struct_declarator_list ';' 
	{ 
		$$ = [];
		for(var declInit of $2){
			$$.push(new Declaration(new Type($1, @$), declInit.declarator, declInit.initializer, @$));
		}
	}
	/*NOT SUPPORTED-------------------------------------------
	| static_assert_declaration
	--------------------------------------------------------*/
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
	: ':' constant_expression { $$ = { declarator: new Unnamed(@$), initializer: $2 }; } 
	| declarator ':' constant_expression { $$ = { declarator: $1, initializer: $3 }; }
	| declarator { $$ = { declarator: $1, initializer: null }; }
	;

enum_specifier
	: ENUM '{' enumerator_list '}' { $$ = new Enum(new Unnamed(@$), $3, @$); }
	| ENUM '{' enumerator_list ',' '}' { $$ = new Enum(new Unnamed(@$), $3, @$); }
	| ENUM IDENTIFIER '{' enumerator_list '}' { $$ = new Enum($2, $4, @$); }
	| ENUM IDENTIFIER '{' enumerator_list ',' '}' { $$ = new Enum($2, $4, @$); }
	| ENUM IDENTIFIER { $$ = new Tagname($2, @$); }
	;

enumerator_list
	: enumerator { $$ = [$1]; }
	| enumerator_list ',' enumerator { $$ = [...$1, $3]; }
	;

enumerator
	: enumeration_constant '=' constant_expression { $$ = new Enumerator($1, $3, @$); }
	| enumeration_constant { $$ = new Enumerator($1, null, @$); }
	;

/*NOT SUPPORTED-------------------------------------------
atomic_type_specifier
	: ATOMIC '(' type_name ')'
	;
--------------------------------------------------------*/


/*NOT SUPPORTED-------------------------------------------
type_qualifier
	: CONST
	| RESTRICT
	| VOLATILE
	| ATOMIC
	;
--------------------------------------------------------*/

/*NOT SUPPORTED-------------------------------------------
function_specifier
	: INLINE
	| NORETURN
	;
--------------------------------------------------------*/

/*NOT SUPPORTED-------------------------------------------
alignment_specifier
	: ALIGNAS '(' type_name ')'
	| ALIGNAS '(' constant_expression ')'
	;
--------------------------------------------------------*/

declarator
	: pointer direct_declarator { $$ = new Declarator(DECLTYPE.PTR, $2, $1, @$); }
	| direct_declarator { $$ = $1; } // always returns typeof Declarator
	;

direct_declarator // must always return typeof Declarator
	: IDENTIFIER { $$ = new Declarator(DECLTYPE.ID, null, new Identifier($1, @$), @$); }
	| '(' declarator ')' { $$ = $2; }
	| direct_declarator '[' ']' { $$ = new Declarator(DECLTYPE.ARR, $1, null, @$); }
	/* NOT SUPPORTING VARIABLE LENGTH ARRAYS FOR NOW | direct_declarator '[' '*' ']' { $$ = { ...$1, declarator_type: "array", size: null }; } // fix these later
	| direct_declarator '[' STATIC type_qualifier_list assignment_expression ']' { $$ = { ...$1, declarator_type: "array"}; }
	| direct_declarator '[' STATIC assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list '*' ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list STATIC assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list assignment_expression ']' { $$ = $1; }
	| direct_declarator '[' type_qualifier_list ']' { $$ = $1; } !NOT SUPPORTING VARIABLE LENGTH ARRAYS FOR NOW */ 
	| direct_declarator '[' assignment_expression ']' { $$ = new Declarator(DECLTYPE.ARR, $1, $3, @$); }
	| direct_declarator '(' parameter_type_list ')' { $$ = new Declarator(DECLTYPE.FNC, $1, { parameters: $3 }, @$); }
	| direct_declarator '(' ')' { $$ = new Declarator(DECLTYPE.FNC, $1, { parameters: [] }, @$); }
	| direct_declarator '(' identifier_list ')' { $$ = new Declarator(DECLTYPE.FNC, $1, { parameters: $3 }, @$); } // Function parameters without type (type defaults to int) 
	;

pointer
	 /*NOT SUPPORTED
	| '*' type_qualifier_list pointer { $$ = new Pointer($3, null, @$); }
	| '*' type_qualifier_list { $$ = new Pointer(null, $2, @$); } */
	: '*' pointer { $$ = new Pointer($2, null, @$); } //TODO remove second parameter as qualifiers are no longer supported
	| '*' { $$ = new Pointer(null, null, @$); }
	;

/*NOT SUPPORTED-------------------------------------------
type_qualifier_list
	: type_qualifier { $$ = [$1]; }
	| type_qualifier_list type_qualifier { $$ = [...$1, $2]; }
	;
--------------------------------------------------------*/


parameter_type_list
	: parameter_list ',' ELLIPSIS { $$ = $1; }
	| parameter_list { $$ = $1; }
	;

parameter_list
	: parameter_declaration { $$ = [$1]; }
	| parameter_list ',' parameter_declaration { $$ = [...$1, $3]; }
	;

parameter_declaration
	: declaration_specifiers declarator { $$ = new Declaration(new Type($1, @$), $2, null, @$); }
	| declaration_specifiers abstract_declarator { $$ = new Declaration(new Type($1, @$), $2, null, @$); }
	| declaration_specifiers { $$ = new Declaration(new Type($1), new Unnamed(@$), null, @$); }
	;

identifier_list
	: IDENTIFIER { $$ = [new Declaration(new Type(), new Declarator(DECLTYPE.ID, new Identifier($1)), null, @$)]; }
	| identifier_list ',' IDENTIFIER { $$ = [...$1, new Declaration(new Type(), new Declarator(DECLTYPE.ID, new Identifier($3)), null, @$)]; }
	;

type_name
	//!TODO
	: specifier_qualifier_list abstract_declarator
	| specifier_qualifier_list
	;

abstract_declarator
	: pointer direct_abstract_declarator { $$ = new AbstractDeclarator(DECLTYPE.PTR, $2, $1, @$); }
	| pointer { $$ = new AbstractDeclarator(DECLTYPE.PTR, null, $1, @$); }
	| direct_abstract_declarator { $$ = $1; }
	;

direct_abstract_declarator
	: '(' abstract_declarator ')' { $$ = $2; }
	| '[' ']' { $$ = new AbstractDeclarator(DECLTYPE.ARR, null, null, @$); }
	/*| '[' '*' ']'
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
	| direct_abstract_declarator '[' type_qualifier_list ']'*/
	| direct_abstract_declarator '[' assignment_expression ']' { $$ = new AbstractDeclarator(DECLTYPE.ARR, $1, $3); }
	| '(' ')' { $$ = new AbstractDeclarator(DECLTYPE.FNC, null, null, @$); }
	| '(' parameter_type_list ')' { $$ = new AbstractDeclarator(DECLTYPE.FNC, null, $2, @$); }
	| direct_abstract_declarator '(' ')' { $$ = new AbstractDeclarator(DECLTYPE.FNC, $1, { parameters: [] }, @$); }
	| direct_abstract_declarator '(' parameter_type_list ')' { $$ = new AbstractDeclarator(DECLTYPE.FNC, $1, { parameters: $3 }, @$); }
	;

initializer
	: '{' initializer_list '}' { $$ = new Initializer(INITTYPE.ARR, $2, null, null, @$); }
	| '{' initializer_list ',' '}' { $$ = new Initializer(INITTYPE.ARR, $2, null, null, @$); }
	| assignment_expression { $$ = new Initializer(INITTYPE.EXPR, $1, null, null, @$); }
	;

initializer_list
	: designation initializer { $$ = [new Initializer(INITTYPE.NESTED, $2, null, $1, @$)]; }
	| initializer { $$ = [new Initializer(INITTYPE.NESTED, $1, null, null, @$)]; }
	| initializer_list ',' designation initializer { $$ = [...$1, new Initializer(INITTYPE.NESTED, $4, null, $3, @$)]; }
	| initializer_list ',' initializer { $$ = [...$1, new Initializer(INITTYPE.NESTED, $3, null, null, @$)]; }
	;

designation
	: designator_list '=' { $$ = $1; }
	;

designator_list
	: designator { $$ = [$1]; }
	| designator_list designator { $$ = [...$1, $2]; }
	;

designator
	: '[' constant_expression ']' { $$ = new Designator($2, @$); }
	| '.' IDENTIFIER { $$ = new Designator(new Identifier($2, @$)); }
	;

/*NOT SUPPORTED-------------------------------------------
static_assert_declaration
	: STATIC_ASSERT '(' constant_expression ',' STRING_LITERAL ')' ';'
	;
--------------------------------------------------------*/

statement
	: labeled_statement { $$ = $1; }
	| compound_statement { $$ = $1; }
	| expression_statement { $$ = $1; }
	| selection_statement { $$ = $1; }
	| iteration_statement { $$ = $1; }
	| jump_statement { $$ = $1; }
	;

labeled_statement
	: IDENTIFIER ':' statement { $$ = new LStmt($1, $3, @$); }
	| CASE constant_expression ':' statement  { $$ = new CaseStmt($2, $4, @$); }
	| DEFAULT ':' statement { $$ = new CaseStmt(null, $3, @$); }
	;

compound_statement
	: '{' '}' { $$ = new CStmt([], @$); }
	| '{'  block_item_list '}' { $$ = new CStmt($2, @$); }
	;

block_item_list
	: block_item { $$ = $1; }
	| block_item_list block_item { $$ = [...$1, ...$2]; } // block_item always returns array
	;

block_item
	: declaration { $$ = Array.isArray($1) ? $1 : [$1]; }
	| statement { $$ = Array.isArray($1) ? $1 : [$1]; }
	;

expression_statement
	: ';' { $$ = new NOP(@$); }
	| expression ';' { $$ = Array.isArray($1) ? $1 : [$1]; } // expression always returns array (due to operator ",")
	;

selection_statement
	: IF '(' expression ')' statement ELSE statement { $$ = new IfStmt($3, $5, $7, @$); }
	| IF '(' expression ')' statement { $$ = new IfStmt($3, $5, null, @$); }
	| SWITCH '(' expression ')' statement { $$ = new SwitchStmt($3, $5, @$); }
	;

iteration_statement
	: WHILE '(' expression ')' statement { $$ = new WhileLoop($3, $5, @$); }
	| DO statement WHILE '(' expression ')' ';' { $$ = new DoWhileLoop($5, $2, @$); }
	| FOR '(' expression_statement expression_statement ')' statement { $$ = new ForLoop($3, $4, null, $6, @$); }
	| FOR '(' expression_statement expression_statement expression ')' statement { $$ = new ForLoop($3, $4, $5, $7, @$); }
	| FOR '(' declaration expression_statement ')' statement { $$ = new ForLoop($3, $4, null, $6, @$); }
	| FOR '(' declaration expression_statement expression ')' statement { $$ = new ForLoop($3, $4, $5, $7, @$); }
	;

jump_statement
	: GOTO IDENTIFIER ';' { $$ = new Goto(new Identifier($2, @$), @$); }
	| CONTINUE ';' { $$ = new Continue(@$); }
	| BREAK ';' { $$ = new Break(@$); }
	| RETURN ';' { $$ = new Return(null, @$); }
	| RETURN expression ';' { $$ = new Return($2, @$); }
	;

translation_unit
	: translation_unit external_declaration EOF { parser.yy.lastSymbols = parser.yy.symbols; return Array.isArray($2) ? [...$1, ...$2] : [...$1, $2]; } // parser.yy gets cached btw -> fixed in interpreter.parse
	| external_declaration EOF { parser.yy.lastSymbols = parser.yy.symbols; return Array.isArray($1) ? $1 : [$1]; }
	| translation_unit external_declaration { $$ = Array.isArray($2) ? [...$1, ...$2] : [...$1, $2]; }
	| external_declaration { $$ = Array.isArray($1) ? $1 : [$1]; }
	;

external_declaration
	: function_definition { $$ = $1; } // function definition // returns single instance of class Func
	| declaration { $$ = $1; } // global declaration // always returns array of Declarations
	;

function_definition
	: declaration_specifiers declarator compound_statement { $$ = new Fnc($2, $1, $3, @$); }
	/*NOT SUPPORTED-------------------------------------------
	| declaration_specifiers declarator declaration_list compound_statement 
	// ignore K&R type function declaration for now (https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Old_002dStyle-Function-Definitions.html)
	--------------------------------------------------------*/
	;

declaration_list
	: declaration
	| declaration_list declaration
	;
