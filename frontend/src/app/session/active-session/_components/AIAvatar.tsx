import Image from "next/image";

const aiAvatarUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAUIzVQ3oc__Xw0AYthf402PkhH_5wxRL8xVVRDcLofruubCrxqOLz2htEWhbCUyF4UjpQxHm943tw5iyEx1Bu768Qmv7K2L8yXu-HTIFnE1mOQLiWLr8tQVDko9AM1OzBVrf94Sc5VHku2a-2DcnXpcDyDC0Sd8SSUqMaJsiinwTkagoyMUSG0bhrlY5sWpm4OvS6XDeDdlDlJ3A2xCGvgQ8iQ-heiY7KY_wdGwawkN7D_PFzZBt4Av4nv2n9EFg0u1n_xpz6U5cR6";

interface AIAvatarProps {
  waveformOpacity: string;
}

export default function AIAvatar({ waveformOpacity }: AIAvatarProps) {
  return (
    <div className="mt-32 flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="w-16 h-16 rounded-full bg-surface-container-high border border-primary/20 flex items-center justify-center overflow-hidden">
        <Image
          src={aiAvatarUrl}
          alt="FymenAI Logo"
          width={64}
          height={64}
          className="w-full h-full object-cover opacity-80 mix-blend-screen"
        />
      </div>
      <div
        className={`flex items-center justify-center gap-0.5 h-10 w-48 ${waveformOpacity}`}
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={`wave-${index}`}
            className={`waveform-bar w-0.75 bg-primary/${40 + index * 10} rounded-full`}
            style={{ animationDelay: `${(index * 0.2) % 0.6}s` }}
          />
        ))}
      </div>
    </div>
  );
}