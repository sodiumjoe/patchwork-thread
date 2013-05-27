var should = require( 'should' )
  , assert = require( 'assert' )
  , sinon = require( 'sinon' )
  , github = require( '../lib/github' )
  ;

describe( 'lib/github.js', function(){
    var client = {};
    
    before( function( done ) {
        client.commits = function( callback ) {
            var commits = [ { 'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e' }
                          , { 'sha': 'othersha' }
                          ];
            callback( null, commits );
        };
        sinon.spy( client, 'commits' );
        done();
    });

    after( function( done ) {
        client.commits.restore();
        done();
    });

    describe( 'getRootSha()', function(){

        it( 'should callback with the root sha', function( done ) {
            var g = github( client );
            //github( client ).getRootSha( function( err, sha ) {
            g.getRootSha( function( err, sha ) {
                should.not.exist( err );
                sha.should.equal( '6dcb09b5b57875f334f61aebed695e2e4193db5e' );
                done();
            });
        });

    });

    before( function( done ) {
        client.tree = function( sha, recurseBool, callback ) {
            var tree = { sha: 'sha1'
                       , url: 'url1'
                       , tree: [ { 'type': 'tree', 'path': 'path1' }
                               , { 'type': 'blob', 'path': 'path2.md' }
                               , { 'type': 'blob', 'path': 'path3.markdown' }
                               , { 'type': 'tree', 'path': 'path4' }
                               , { 'type': 'tree', 'path': 'path5' }
                               , { 'type': 'blob', 'path': 'path6.md' }
                               ]
                       };
            callback( null, tree );
        };

        sinon.spy( client, 'tree' );
        done();
    });

    after( function( done ) {
        client.tree.restore();
        done();
    });

    describe( 'getFileList()', function(){

        it( 'should get the tree from the root sha and filter file objects', function( done ) {
            github( client ).getFileList( 'sha1', function( err, list ) {
                assert( client.tree.calledOnce );
                client.tree.getCall( 0 ).args[ 0 ].should.equal( 'sha1' );
                client.tree.getCall( 0 ).args[ 1 ].should.equal( true );
                should.not.exist( err );
                list.length.should.equal( 3 );
                list[ 0 ].should.equal( 'path2.md' );
                list[ 1 ].should.equal( 'path3.markdown' );
                list[ 2 ].should.equal( 'path6.md' );
                done();
            });
        });

    });

    before( function( done ) {
        client.contents = function( path, callback ) {
            callback( null, path );
        };
        sinon.spy( client, 'contents' );
        done();
    });

    after( function( done ) {
        client.contents.restore();
        done();
    });

    describe( 'getContent()', function(){
        
        it( 'should get raw content from github', function( done ) {
            github( client ).getContent( 'path/to/file', function( err, raw ) {
                assert( client.contents.calledOnce );
                client.contents.getCall( 0 ).args[ 0 ].should.equal( 'path/to/file' );
                should.not.exist( err );
                raw.should.equal( 'path/to/file' );
                done();
            });
        });

    });

});
