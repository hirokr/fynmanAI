export default function SystemSection() {
  return (
    <section className="space-y-6 pt-6" id="system">
      <div className="pb-4 border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          System
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Application-wide interface and behavior settings.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-outline-variant">
          <div>
            <p className="font-medium text-on-surface">Dark Mode</p>
            <p className="text-xs text-outline">Optimized for low-light focus</p>
          </div>
          <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-outline-variant">
          <div>
            <p className="font-medium text-on-surface">Focus Notifications</p>
            <p className="text-xs text-outline">Mute all during active sessions</p>
          </div>
          <div className="w-12 h-6 bg-outline-variant rounded-full relative cursor-pointer">
            <div className="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}