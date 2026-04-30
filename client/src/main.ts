import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { Configuration } from './app/api/configuration';
import { credentialsInterceptor } from './app/interceptors/credentials.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    {
      provide: Configuration,
      useFactory: () => {
        const config = new Configuration({
          basePath: '',
          withCredentials: true
        });
        const originalIsJson = config.isJsonMime.bind(config);
        config.isJsonMime = (mime: string) => mime === '*/*' || originalIsJson(mime);
        return config;
      }
    }
  ]
});
