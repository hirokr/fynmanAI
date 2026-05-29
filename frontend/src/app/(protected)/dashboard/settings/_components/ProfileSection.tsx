import Image from "next/image";

const profileImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuApIvNFMJXHCg8P4tpG5QDsfymtv-urWSYBmXDYrNt9JRKsYzVCASmmYLijjs7p5tsT_r72DIv-dfvV9jy7r5-jyTvcH8jMGmAkBtOjB8JinodWzKr6jkTm_cVbxPCfco3eCxPSm2SBtD9-VWB-yGRSecULyws75JmL9YZAkCFMlSgCRceb5J2ojTsF0u6FY5_EI7SGKq-wJhUVIs0JKetZHC1PHt7YZZu6LOB88CQMWpbrPqyZutKn2TggFRTQ8yBriIB5_ltIzdYl";

export default function ProfileSection() {
  return (
    <section className="space-y-6" id="profile">
      <div className="pb-4 border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Profile
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Manage your public identity and core account details.
        </p>
      </div>
      <div className="flex items-center gap-8">
        <div className="relative">
          <Image
            src={profileImageUrl}
            alt="Profile"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full border-2 border-outline-variant"
          />
          <button className="absolute bottom-0 right-0 bg-primary p-1 rounded-full border-2 border-background">
            <span className="material-symbols-outlined text-[16px] text-on-primary">
              edit
            </span>
          </button>
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Full Name
              </label>
              <input
                className="w-full bg-surface-container border border-outline-variant rounded px-4 py-2 focus:border-primary focus:outline-none transition-all"
                type="text"
                defaultValue="Alexander Thorne"
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm uppercase tracking-wider text-outline">
                Email Address
              </label>
              <input
                className="w-full bg-surface-container border border-outline-variant rounded px-4 py-2 focus:border-primary focus:outline-none transition-all"
                type="email"
                defaultValue="a.thorne@fymen.ai"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}