import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAccount } from '@/hooks/use-account'

export function AccountAvatarSection() {
  const account = useAccount()

  return (
    <div className="sm:col-span-2">
      <div className="text-sm text-muted-foreground">Avatar</div>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border">
          {account.imagePreview ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={account.imagePreview}
              alt="selected avatar preview"
              className="w-full h-full object-cover"
            />
          ) : account.user?.image ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={account.user.image} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>

        {account.editing ? (
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => account.imageInputRef.current?.click()}>
                Choose photo
              </Button>
              <Button type="button" onClick={account.handleImageUpload} disabled={account.uploadingImage}>
                {account.uploadingImage ? <Spinner className="size-4" /> : 'Upload photo'}
              </Button>
            </div>
            <input
              ref={account.imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (account.imagePreview) URL.revokeObjectURL(account.imagePreview)
                account.setSelectedImage(file)
                account.setImagePreview(file ? URL.createObjectURL(file) : null)
              }}
            />
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP. We upload the image now, but only persist the URL.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
