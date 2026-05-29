import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Controller,
  useForm,
  type FieldError as RHFFieldError,
} from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { loginUser } from "@/actions/auth.actions"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"
import { useGoogleSignIn } from "@/lib/auth-client"
import { Spinner } from "./ui/spinner"

const loginSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email address.")
      .or(z.literal("")),
    username: z
      .string()
      .regex(
        /^[a-zA-Z0-9._]+$/,
        "Username can only contain letters, numbers, dots, and underscores."
      )
      .or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters long."),
  })
  .superRefine((data, ctx) => {
    if (!data.email.trim() && !data.username.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Please enter either an email or a username.",
      })
      ctx.addIssue({
        code: "custom",
        path: ["username"],
        message: "Please enter either an email or a username.",
      })
    }
  })

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [withEmail, setWithEmail] = useState(false)
  const { signIn, loading } = useGoogleSignIn()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginValues) {
    form.clearErrors("root")
    try {
      if (withEmail && !data.email.trim()) {
        form.setError("email", { message: "Email is required." })
        return
      }

      if (!withEmail && !data.username.trim()) {
        form.setError("username", { message: "Username is required." })
        return
      }

      const payload = { ...data, withEmail }

      const { success, message } = await loginUser({ data: payload })

      if (!success) {
        form.setError("root", {
          message: message || "Unable to sign in.",
        })
      } else {
        toast.success("Logged in successfully!")
        navigate({ to: "/" })
      }
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Login failed.",
      })
    }
  }

  const handleMailToggle = () => {
    console.log("Toggling login method. Current withEmail:", withEmail)
    setWithEmail((prev) => !prev)
    // form.clearErrors(["email", "username"])
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="ring-0">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name={withEmail ? "email" : "username"}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor={field.name}>
                        {withEmail ? "Email" : "Username"}
                      </FieldLabel>
                      <Button
                        type="button"
                        onClick={handleMailToggle}
                        // variant="link"
                        size="xs"
                      >
                        {withEmail ? "Use Username" : "Use Email"}
                      </Button>
                    </div>
                    <Input
                      {...field}
                      id={field.name}
                      type={withEmail ? "email" : "text"}
                      placeholder={withEmail ? "kiton@mail.com" : "kiton_123"}
                      aria-invalid={fieldState.invalid}
                      autoComplete={withEmail ? "email" : "username"}
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error as RHFFieldError]}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center">
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      {/* <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a> */}
                    </div>

                    <InputGroup>
                      <InputGroupInput
                        {...(field as React.ComponentProps<"input">)}
                        id={field.name}
                        type={passwordVisible ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        autoComplete="current-password"
                      />
                      <InputGroupAddon align={"inline-end"}>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => setPasswordVisible((v) => !v)}
                          type="button"
                        >
                          {passwordVisible ? <EyeOff /> : <Eye />}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>

                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error as RHFFieldError]}
                      />
                    )}
                  </Field>
                )}
              />

              {form.formState.errors.root?.message && (
                <FieldError>{form.formState.errors.root.message}</FieldError>
              )}

              <Field>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || loading}
                >
                  {form.formState.isSubmitting ? <Spinner /> : "Login"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={form.formState.isSubmitting || loading}
                  onClick={signIn}
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    <>
                      <svg viewBox="0 0 128 128">
                        <path
                          fill="#fff"
                          d="M44.59 4.21a63.28 63.28 0 004.33 120.9 67.6 67.6 0 0032.36.35 57.13 57.13 0 0025.9-13.46 57.44 57.44 0 0016-26.26 74.33 74.33 0 001.61-33.58H65.27v24.69h34.47a29.72 29.72 0 01-12.66 19.52 36.16 36.16 0 01-13.93 5.5 41.29 41.29 0 01-15.1 0A37.16 37.16 0 0144 95.74a39.3 39.3 0 01-14.5-19.42 38.31 38.31 0 010-24.63 39.25 39.25 0 019.18-14.91A37.17 37.17 0 0176.13 27a34.28 34.28 0 0113.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.22 61.22 0 0087.2 4.59a64 64 0 00-42.61-.38z"
                        ></path>
                        <path
                          fill="#e33629"
                          d="M44.59 4.21a64 64 0 0142.61.37 61.22 61.22 0 0120.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.28 34.28 0 00-13.64-8 37.17 37.17 0 00-37.46 9.74 39.25 39.25 0 00-9.18 14.91L8.76 35.6A63.53 63.53 0 0144.59 4.21z"
                        ></path>
                        <path
                          fill="#f8bd00"
                          d="M3.26 51.5a62.93 62.93 0 015.5-15.9l20.73 16.09a38.31 38.31 0 000 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 01-5.5-40.9z"
                        ></path>
                        <path
                          fill="#587dbd"
                          d="M65.27 52.15h59.52a74.33 74.33 0 01-1.61 33.58 57.44 57.44 0 01-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0012.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68z"
                        ></path>
                        <path
                          fill="#319f43"
                          d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0044 95.74a37.16 37.16 0 0014.08 6.08 41.29 41.29 0 0015.1 0 36.16 36.16 0 0013.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 01-25.9 13.47 67.6 67.6 0 01-32.36-.35 63 63 0 01-23-11.59A63.73 63.73 0 018.75 92.4z"
                        ></path>
                      </svg>
                      <span className="">Login with Google</span>
                    </>
                  )}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
