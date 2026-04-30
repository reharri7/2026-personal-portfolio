import {bootstrapApplication, BootstrapContext} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { serverRoutes } from './app/app.routes.server';

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    AppComponent,
    {
      providers: [
        provideRouter(routes),
        provideServerRendering(withRoutes(serverRoutes)),
        provideHttpClient(withFetch())
      ]
    },
    context
  );
}
