Thread
======

Thread is the data access and update piece of [Patchwork](http://patchworkcms.com).

You use Thread by pointing it at a content repository in GitHub like [this one](https://github.com/joebadmo/patchwork). It then grabs each markdown file, parses it, and updates a database and (optionally) an IndexTank API-compatible search index. It will also optionally upload assets to an Amazon S3 bucket.

You can also set a [post-receive webhook](https://help.github.com/articles/post-receive-hooks) for a content repo on GitHub so that Thread will keep your database, search index, and S3 bucket whenever you commit changes to the content repo.

### Usage

Note: The canonical deployment for Patchwork is on [AppFog](http://www.appfog.com).

#### 1. Clone this repo.
#### 2. Copy the `config.yml.example` file to `config.yml`.

    $ cp config.yml.example config.yml

#### 3. Modify `config.yml` to point at your content repo.
#### 4. Push to AppFog.

    $ af push patchwork-thread

#### 5. Create and bind a new MongoDB service to the new app.

    $ af create-service mongodb --name joebadmo-patchwork --bind patchwork-thread

#### 6. Add environment variables for your various credentials.

    $ af env-add patchwork-thread GITHUB_PASSWORD="FakePass1"
    $ af env-add patchwork-thread S3_ACCESS_KEY="RANDOMSTRING"
    $ af env-add patchwork-thread S3_SECRET="RANDOMSTRING"
    $ af env-add patchwork-thread SEARCHIFY_PRIVATE_API_URL="http://:password@something.api.searchify.com"

#### 7. Index your content repo.

    $ curl patchwork-thread.aws.af.cm/index/all/joebadmo/patchwork

#### 8. Now set up your [Quilt](https://github.com/joebadmo/patchwork-quilt).

### Testing

    $ mocha

# License

The MIT License (MIT)

Copyright (c) 2013 Joe Moon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
