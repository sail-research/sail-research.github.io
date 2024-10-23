# Security and Artificial Intelligence Lab Website (SAIL) @ VinUniversity

This is the website of our academic research group at [VinUniversity]().

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

### Connect to Domain and Deploy
To connect a domain from Cheapname (or any other domain registrar) to your GitHub Pages site (`github.io`), follow these steps:

### Step 1: Configure Your GitHub Repository

1. **Go to your GitHub repository** (e.g., `sail-research/sail-research.github.io`).
2. **Click on the "Settings" tab.**
3. **Scroll down to the "Pages" section**.
4. In the "Custom domain" field, enter your domain name (e.g., `www.yourdomain.com` or `yourdomain.com`) and click "Save."
5. GitHub will provide instructions for setting up a CNAME file. Ensure you create a file named `CNAME` in the root of your repository and add your custom domain (e.g., `www.yourdomain.com`) to that file.

### Step 2: Set Up DNS Records on Cheapname

1. **Log in to your Cheapname account.**
2. **Navigate to the Domain Management section.**
3. **Find your domain and select "DNS settings" or "Manage DNS."**

#### A. If you're using a root domain (e.g., `yourdomain.com`):
- **Add an A Record:**
  - **Type:** A
  - **Host:** @ (or leave it blank, depending on the interface)
  - **Value:** `185.199.108.153`
  - **TTL:** Default or 3600 seconds

- **Add another A Record (repeat for each IP):**
  - **Value:** `185.199.109.153`
  - **Value:** `185.199.110.153`
  - **Value:** `185.199.111.153`

#### B. If you're using a subdomain (e.g., `www.yourdomain.com`):
- **Add a CNAME Record:**
  - **Type:** CNAME
  - **Host:** www
  - **Value:** `yourusername.github.io` (replace `yourusername` with your GitHub username)
  - **TTL:** Default or 3600 seconds

### Step 3: Wait for DNS Propagation

DNS changes can take some time to propagate (usually a few minutes to 48 hours). You can check if your domain is pointing to your GitHub Pages site using tools like [whatsmydns.net](https://www.whatsmydns.net/).

### Step 4: Verify the Connection

Once the DNS changes have propagated, visit your domain (e.g., `www.yourdomain.com` or `yourdomain.com`) in a web browser. It should display your GitHub Pages site.

### Additional Notes:
- Make sure your repository is public to serve your pages without issues.
- If you want to enforce HTTPS, GitHub will automatically enable HTTPS for your custom domain once the DNS is correctly set up. You can check this in the Pages settings in your repository.

Following these steps should help you successfully connect your domain from Cheapname to your GitHub Pages site!


To link your GitHub Pages site at `https://sail-research.github.io/` to your custom domain `sail-research.com` using Cheapname, here’s how to configure your DNS settings:

### DNS Configuration on Cheapname

1. **Log in to your Cheapname account**.
2. Navigate to the **DNS Management** section for your domain (`sail-research.com`).

3. **Add the following DNS records**:

   #### A Records (for the root domain)
   - **Type**: A
     - **Name**: `@`
     - **Value**: `185.199.108.153`
   - **Type**: A
     - **Name**: `@`
     - **Value**: `185.199.109.153`
   - **Type**: A
     - **Name**: `@`
     - **Value**: `185.199.110.153`
   - **Type**: A
     - **Name**: `@`
     - **Value**: `185.199.111.153`

   #### CNAME Record (for www subdomain, if you want to support it)
   - **Type**: CNAME
     - **Name**: `www`
     - **Value**: `sail-research.github.io`

4. **Save your changes**.

### GitHub Configuration

1. Go to your GitHub repository (`sail-research`).
2. Navigate to **Settings** → **Pages**.
3. In the **Custom domain** field, enter `sail-research.com` (or `www.sail-research.com` if you want to use that).
4. Save the settings.

### Additional Steps

- **Enforce HTTPS**: After the DNS changes propagate (which can take a few minutes to 48 hours), go back to GitHub Pages settings and check the **Enforce HTTPS** option if it appears.
  
### Verification

- Use a DNS checker tool like [DNS Checker](https://dnschecker.org) to verify that your A records are pointing to GitHub's IP addresses.
- Once everything is set up correctly, you should be able to visit `sail-research.com` and see your GitHub Pages site.

If you encounter any issues or have questions, feel free to ask!

### References
For more detailed guidance, you can check the [official Jekyll documentation](https://jekyllrb.com/docs/) and explore additional resources for customizing your Jekyll site further.
