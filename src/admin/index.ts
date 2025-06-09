import Page from "./routes/klaviyo/page";

const plugin = {
  id: "klaviyo",
  routes: [
    {
      path: "/klaviyo",
      component: Page,
    },
  ],
};

export default plugin;
