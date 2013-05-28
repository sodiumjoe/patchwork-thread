var should = require( 'should' )
  , assert = require( 'assert' )
  , sinon = require( 'sinon' )
  , parse = require( '../lib/parse/helpers' )
  ;

describe( 'lib/parse/helpers.js', function(){

    describe( 'parse functions', function(){

        var base64, rawString, yamlObj, yamlString, parsedObj, ghresponse, head, body;

        before( function(){
            base64 = 'c29tZSBiYXNlIDY0IHRleHQ=';
        });

        describe( 'decodeBase64()', function(){

            it( 'should decode base64', function(){
                parse.decodeBase64(base64).should.equal('some base 64 text');
            });

        });

        before( function(){
            rawString = '---\ntitle: "Thread"\nweight: 1\n---\nBody text.';
        });

        describe( 'extractYamlFront()', function(){
            it( 'should extract that yaml front matter', function(){
                yamlObj = parse.extractYamlFront( rawString );
                yamlObj.yamlString.should.equal( 'title: "Thread"\nweight: 1' );
                yamlObj.body.should.equal( 'Body text.' );
            });
        });

        before( function(){
            yamlString = 'title: "Thread"\nweight: 1';
        });

        describe( 'parseYaml()', function(){

            it( 'should parse yaml', function(){
                var yaml = parse.parseYaml(yamlString);
                yaml.title.should.equal( 'Thread' );
                yaml.weight.should.equal( 1 );
            });

        });
            
        describe( 'convertMd()', function(){
           
            it( 'should convert markdown to html' );

        });

        before( function() {
            ghresponse = { 'path': 'README.md'
                         , 'content': 'encoded content ...'
                         };
            head = { title: 'Thread'
                   , weight: 1
                   };
            body = 'Body text.';
        });

        describe( 'formatContentObj', function(){

            it( 'should construct the content obj', function(){
                parsedObj = parse.formatContentObj( ghresponse, head, body );
                parsedObj.path.should.equal( 'README.md' );
                parsedObj.title.should.equal( 'Thread' );
                parsedObj.weight.should.equal( 1 );
                parsedObj.body.should.equal( 'Body text.' );
            });

        });

    });

});
