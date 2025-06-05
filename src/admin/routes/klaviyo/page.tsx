import React from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Container, Heading, Input, Label, Switch, Button, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useKlaviyoSettings, useUpdateKlaviyoSettings, UpdateKlaviyoConfigRequest } from "../../lib/klaviyo-api"
import QueryClientProvider from "../../lib/provider/QueryProvider"








const KlaviyoSettings = () => {
  const { data: klaviyoSettings, isLoading } = useKlaviyoSettings()
  const updateKlaviyoSettings = useUpdateKlaviyoSettings()
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<UpdateKlaviyoConfigRequest>({
    defaultValues: {
      public_key: "",
      server_prefix: "https://a.klaviyo.com",
      is_enabled: false,
      track_order_events: true,
      track_customer_events: true,
      track_product_events: false
    }
  })

  React.useEffect(() => {
    if (klaviyoSettings?.config) {
      reset({
        public_key: klaviyoSettings.config.public_key || "",
        server_prefix: klaviyoSettings.config.server_prefix || "https://a.klaviyo.com",
        is_enabled: klaviyoSettings.config.is_enabled || false,
        track_order_events: klaviyoSettings.config.track_order_events ?? true,
        track_customer_events: klaviyoSettings.config.track_customer_events ?? true,
        track_product_events: klaviyoSettings.config.track_product_events ?? false
      })
    }
  }, [klaviyoSettings, reset])

  const onSubmit = (data: UpdateKlaviyoConfigRequest) => {
    updateKlaviyoSettings.mutate(data)
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Klaviyo Settings</Heading>
        </div>
        <div className="px-6 py-4">
          <Text>Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Klaviyo Settings</Heading>
      </div>
      <div className="px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="public_key">Public Key</Label>
              <Input
                id="public_key"
                {...register("public_key")}
                placeholder="Enter your Klaviyo public key"
              />
            </div>
            
            <div>
              <Label htmlFor="server_prefix">Server Prefix</Label>
              <Input
                id="server_prefix"
                {...register("server_prefix")}
                placeholder="https://a.klaviyo.com"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_enabled"
                checked={watch("is_enabled")}
                onCheckedChange={(checked) => setValue("is_enabled", checked)}
              />
              <Label htmlFor="is_enabled">Enable Klaviyo Integration</Label>
            </div>

            <div className="space-y-3">
              <Text size="base" weight="plus">Event Tracking</Text>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="track_order_events"
                  checked={watch("track_order_events")}
                  onCheckedChange={(checked) => setValue("track_order_events", checked)}
                />
                <Label htmlFor="track_order_events">Track Order Events</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="track_customer_events"
                  checked={watch("track_customer_events")}
                  onCheckedChange={(checked) => setValue("track_customer_events", checked)}
                />
                <Label htmlFor="track_customer_events">Track Customer Events</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="track_product_events"
                  checked={watch("track_product_events")}
                  onCheckedChange={(checked) => setValue("track_product_events", checked)}
                />
                <Label htmlFor="track_product_events">Track Product Events</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              {klaviyoSettings && (
                <>
                  <Text size="small" className="text-ui-fg-subtle">
                    API Key Status: {klaviyoSettings.has_api_key ? "✓ Configured" : "⚠ Not configured"}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    Integration Status: {klaviyoSettings.is_enabled ? "✓ Enabled" : "⚠ Disabled"}
                  </Text>
                </>
              )}
            </div>
            
            <Button type="submit" disabled={updateKlaviyoSettings.isPending}>
              {updateKlaviyoSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  )
}









const KlaviyoPage = () => {

  return (
    <QueryClientProvider>
      <KlaviyoSettings />
    </QueryClientProvider>
  )
}

export const config = defineRouteConfig({
  label: "Klaviyo",
  icon: ChatBubbleLeftRight,
})

export default KlaviyoPage
