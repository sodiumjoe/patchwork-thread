Indexer
=======

This is an app that takes a collection of markdown files in a simple hierarchical directory structure, parses them into HTML, then populates or updates an indextank search index and a MongoDB. 

Inspired by [Jekyll](https://github.com/mojombo/jekyll), I wanted to build a simple, file-based, git-backed CMS. File-based because I like to edit text in Vim, git-backed because I like the idea of version control for content. I also wanted to decouple the content-management part from the content-presentation part. I wanted the content to live by itself in a repository so that anyone with access to the repo could contribute without having to know anything about how the CMS works (which is not necessarily the case with Jekyll).

### How it works

The entire CMS consists of three parts: 

1. The content repository (in GitHub).
2. Indexer (this app).
3. The front-end.

To connect them, you simply add the content GitHub repo to Indexer's `config.json` file. At this point, you can hit Indexer's `/index` URL, and Indexer will parse the markdown files, index them to an indextank search index, and populate a MongoDB. 

You can also give the content repo Indexer's `/pusher` URL as a post-receive hook. Then the repo will trigger Indexer to update the search index and MongoDB whenever you push a new commit.

The front-end app can then query the MongoDB to display the content. 

### How to use

The `config.json` file contains an object called "config" which has an array containing any number of configurations. 

### Why not just use Jekyll?

Static files are nice and fast, but sometimes you want some dynamic content. Jekyll doesn't offer the flexibility for that. 

Jekyll also doesn't allow you to separate the content from the static-site-generation. With those decoupled, you can use a service like [Prose.io](http://prose.io/) to point to a content repo and have a clean way to simply edit content.
