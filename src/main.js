import { createApp } from 'vue';
import { Quasar, Notify, Dialog } from 'quasar';

// Import Quasar css
import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';

// Import app css
import './css/app.scss';

// Import the App component
import App from './App.vue';

// Import the router
import router from './router';

// Create Vue app
const app = createApp(App);

// Register Quasar
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog
  },
  config: {
    // Default Notify config
    notify: {
      position: 'top-right',
      timeout: 2500,
      textColor: 'white'
    }
  }
});

// Register router
app.use(router);

// Mount app
app.mount('#app');
