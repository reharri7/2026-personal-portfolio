import {bootstrapApplication, BootstrapContext} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServerRendering } from '@angular/platform-server';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    AppComponent,
    {
      providers: [
        provideRouter(routes),
        provideServerRendering()
      ]
    },
    context
  );
}
