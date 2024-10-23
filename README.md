# Security and Artificial Intelligence Lab Website (SAIL) @ VinUniversity

This is the website of our academic research group at VinUniversity.

The template is based on [Allan Lab Website](https://github.com/mpa139/allanlab).



To create a base Jekyll application for deploying a static site using Markdown, you can follow this typical directory structure. This layout will help organize your content, configurations, and styles effectively.

### Base Jekyll Structure

```
your-jekyll-site/
├── _config.yml
├── _posts/
│   └── 2023-01-01-your-first-post.md
├── _layouts/
│   ├── default.html
│   └── post.html
├── _includes/
│   └── header.html
├── _sass/
│   └── main.scss
├── css/
│   └── main.css
├── js/
│   └── main.js
├── images/
│   └── your-image.jpg
├── index.md
└── about.md
```

### Explanation of Each Component:

1. **`_config.yml`**: This file contains configuration settings for your Jekyll site. You can set your site title, description, URL, and other configurations here.

   ```yaml
   title: My Jekyll Site
   description: A simple Jekyll site to showcase Markdown content.
   baseurl: ""
   url: "http://yourdomain.com"
   ```

2. **`_posts/`**: This directory is where you store your blog posts. Each post should be named following the format `YYYY-MM-DD-title.md`. Posts are written in Markdown and can include front matter for metadata.

   Example of a post file (`2023-01-01-your-first-post.md`):
   ```markdown
   ---
   layout: post
   title: "Your First Post"
   date: 2023-01-01
   ---
   This is your first post. You can write in **Markdown**!
   ```

3. **`_layouts/`**: Contains layout files that define the structure of your pages. You can have different layouts for posts, pages, etc.

   Example of a layout file (`default.html`):
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>{{ page.title }}</title>
       <link rel="stylesheet" href="{{ '/css/main.css' | relative_url }}">
   </head>
   <body>
       {% include header.html %}
       <main>
           {{ content }}
       </main>
   </body>
   </html>
   ```

4. **`_includes/`**: This folder holds reusable snippets of code that can be included in your layouts or posts. For example, `header.html` could contain the site's navigation.

5. **`_sass/`**: If you’re using Sass for styling, you can put your Sass files here. You can then import them into your main CSS file.

6. **`css/`**: This directory contains compiled CSS files (e.g., `main.css`) that are generated from your Sass files.

7. **`js/`**: Here you can place JavaScript files for your site’s interactivity.

8. **`images/`**: Store images that you want to use in your posts or pages.

9. **`index.md`**: This is the homepage of your Jekyll site, which can be written in Markdown. It can include links to your posts or other content.

   ```markdown
   ---
   layout: default
   title: Home
   ---
   Welcome to my Jekyll site! Check out my [blog posts]({{ site.baseurl }}/_posts/).
   ```

10. **`about.md`**: A simple page to introduce yourself or your project, written in Markdown.

    ```markdown
    ---
    layout: default
    title: About
    ---
    This site is created using Jekyll and Markdown.
    ```

### Getting Started with Jekyll
1. **Install Jekyll**: Make sure you have Ruby installed. You can then install Jekyll with the following command:

   ```bash
   gem install bundler jekyll
   ```

2. **Create a New Jekyll Site**:

   ```bash
   jekyll new your-jekyll-site
   cd your-jekyll-site
   ```

3. **Build and Serve Your Site**:

   ```bash
   bundle exec jekyll serve
   ```

This will generate your site at `http://localhost:4000`.

### References
For more detailed guidance, you can check the [official Jekyll documentation](https://jekyllrb.com/docs/) and explore additional resources for customizing your Jekyll site further.