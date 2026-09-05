import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// The context carries the platform `renderApplication` already created. Angular
// 19.2.15 started passing it, and dropping it makes bootstrap look for a
// platform of its own — which is the NG0401 ("No platform exists!") that only
// shows up during the prerender pass.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
