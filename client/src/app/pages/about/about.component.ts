import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="grid md:grid-cols-3 gap-12 items-start mb-20">
          <div class="md:col-span-1">
            <div class="w-full h-64 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl mb-6"></div>
            <a href="#" class="btn btn-primary w-full text-center">Download Resume</a>
          </div>
          <div class="md:col-span-2">
            <h1 class="text-4xl font-bold mb-4 text-secondary-900 dark:text-white">About Me</h1>
            <p class="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
              I'm a passionate full stack engineer with 5+ years of experience building scalable web applications. I specialize in creating modern, responsive interfaces and robust backend systems that solve real-world problems.
            </p>
            <p class="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
              My journey in tech started with a curiosity about how things work. Over the years, I've honed my skills across the full spectrum of web development, from crafting pixel-perfect UIs to designing efficient database architectures.
            </p>
            <p class="text-lg text-secondary-600 dark:text-secondary-400">
              When I'm not coding, you can find me contributing to open-source projects, writing technical blog posts, or mentoring junior developers. I believe in lifelong learning and staying updated with the latest technologies and best practices.
            </p>
          </div>
        </div>

        <section class="mb-20">
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Skills</h2>
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-500">Frontend</h3>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Angular</span>
                    <span class="text-secondary-500 dark:text-secondary-400">95%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 95%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">TypeScript</span>
                    <span class="text-secondary-500 dark:text-secondary-400">90%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 90%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">React</span>
                    <span class="text-secondary-500 dark:text-secondary-400">85%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 85%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Tailwind CSS</span>
                    <span class="text-secondary-500 dark:text-secondary-400">88%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 88%"></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-500">Backend</h3>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Node.js</span>
                    <span class="text-secondary-500 dark:text-secondary-400">92%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 92%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Python</span>
                    <span class="text-secondary-500 dark:text-secondary-400">80%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 80%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">PostgreSQL</span>
                    <span class="text-secondary-500 dark:text-secondary-400">85%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 85%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Docker</span>
                    <span class="text-secondary-500 dark:text-secondary-400">78%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 78%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mb-20">
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Experience</h2>
          <div class="space-y-8">
            <div class="card border-l-4 border-primary-600">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Senior Full Stack Engineer</h3>
                <span class="text-sm text-secondary-500">2022 - Present</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold mb-2">Tech Innovators Inc.</p>
              <p class="text-secondary-600 dark:text-secondary-400">
                Leading frontend and backend development for scalable SaaS applications. Mentoring junior developers and establishing best practices for code quality and architecture.
              </p>
            </div>

            <div class="card border-l-4 border-primary-600">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Full Stack Developer</h3>
                <span class="text-sm text-secondary-500">2020 - 2022</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold mb-2">Digital Solutions Ltd.</p>
              <p class="text-secondary-600 dark:text-secondary-400">
                Developed and maintained multiple client projects using Angular, React, and Node.js. Implemented CI/CD pipelines and improved application performance by 40%.
              </p>
            </div>

            <div class="card border-l-4 border-primary-600">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Junior Web Developer</h3>
                <span class="text-sm text-secondary-500">2019 - 2020</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold mb-2">StartUp Ventures</p>
              <p class="text-secondary-600 dark:text-secondary-400">
                Built responsive web applications using HTML, CSS, and JavaScript. Collaborated with designers and backend developers to deliver complete solutions.
              </p>
            </div>
          </div>
        </section>

        <section class="mb-20">
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Education</h2>
          <div class="space-y-6">
            <div class="card">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Bachelor of Science in Computer Science</h3>
                <span class="text-sm text-secondary-500">2018</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold">State University</p>
            </div>

            <div class="card">
              <h3 class="text-xl font-bold mb-1">AWS Certified Solutions Architect</h3>
              <p class="text-primary-600 dark:text-primary-500 font-semibold">Amazon Web Services - 2023</p>
            </div>

            <div class="card">
              <h3 class="text-xl font-bold mb-1">Google Cloud Professional Data Engineer</h3>
              <p class="text-primary-600 dark:text-primary-500 font-semibold">Google Cloud - 2023</p>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Certifications</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">AWS Solutions Architect Professional</span>
            </div>
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">Kubernetes Application Developer</span>
            </div>
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">Google Cloud Professional</span>
            </div>
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">MongoDB Associate Developer</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: []
})
export class AboutComponent {}
