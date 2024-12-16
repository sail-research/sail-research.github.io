---
title: "Security and Artificial Intelligence Lab - Projects"
layout: textlay
excerpt: "Security and Artificial Intelligence Lab: Projects overview"
sitemap: false
permalink: /projects/
---


<div class="projects-list">
  <h1>Our Web Projects</h1>
  <div class="grid-container">

  {% for project in site.data.projects %}
    <div class="project-item">
      <!-- <h2 class="project-name">{{ project.name }}</h2> -->
      <h2 class="project-name">{{ project.name }} <span class="project-venue">[{{ project.venue }}]</span></h2> <!-- Venue added here -->

      {% assign project_image = "/projects/" | append: project.name | append: '/' | append: project.name | append: '.png' %}
      <img src="{{ site.baseurl }}{{ project_image }}" alt="{{ project.name }}">
      <p class="project-links">
        <a class="more-link" href="{{ site.baseurl }}/projects/{{ project.name }}" target="_blank">
          <i class="fas fa-external-link-alt"></i> Project Page
        </a>

        
        
        <a class="more-link" href="{{ project.github }}" target="_blank">
          <i class="fab fa-github"></i> Code
        </a>

        <a class="more-link" href="{{ project.url }}" target="_blank">
          <i class="fas fa-external-link-alt"></i> Paper
        </a>

        <a class="more-link" href="{{ project.github }}" target="_blank">
          <img alt="GitHub stars" class="github-stars" src="https://img.shields.io/github/stars/{{ project.github | replace: 'https://github.com/', '' }}?style=social">
        </a>
        
      </p>

    </div>
  {% endfor %}

  </div>
</div>




<style>
  .projects-list {
    max-width: 1200px;
    margin: 20px auto;
    text-align: center;
  }

  .projects-list h1 {
    color: #333;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 20px;
  }




  .project-item {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    background-color: #f9f9f9;
    text-align: center;
    height: 350px; /* Set your desired height */
    display: flex;
    flex-direction: column; /* Arrange items vertically */
    justify-content: flex-start; /* Align items at the top */
  }

  .project-item h2 {
    font-size: 1.5em;
    color: #007bff;
    margin-bottom: 10px; /* Space below the project name */
  }

  .project-item img {
    height: auto; /* Allow the height to adjust automatically */
    width: 100%; /* Set width to 100% to fill the container */
    max-height: 200px; /* Set a maximum height for the image */
    object-fit: contain; /* Maintain the aspect ratio while fitting the container */
    border-radius: 5px; /* Optional: for rounded corners */
  }

  .project-name, .project-venue {
    margin: 10px 0; /* Space around the project name and venue */
  }

  .project-item a {
    text-decoration: none;
    color: #007bff;
  }

  .project-item a:hover {
    text-decoration: underline;
  }

  .project-links {
    display: flex;
    justify-content: center; /* Center the links */
    align-items: center; /* Align items vertically */
  }

  .project-links a {
    margin: 0 10px; /* Adjusted value for better spacing */
  }

  .github-stars {
    width: 80px; /* Adjust this value to make the badge smaller */
    height: auto; /* Keep the aspect ratio */
  }





</style>
