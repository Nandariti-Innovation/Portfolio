interface PageLoaderProps {
  message?: string;
  hint?: string;
}

export const PageLoader = ({
  message = "Loading page…",
  hint = "Good things take a moment.",
}: PageLoaderProps) => (
  <div className="scene-loader page-loader" role="status" aria-live="polite" aria-busy="true">
    <div className="loader-content">
      <img
        src="/svg/typing_code_loader.svg"
        alt=""
        aria-hidden="true"
        width={640}
        height={420}
        className="loader-icon"
      />
      <div className="loader-progress">
        <p className="loader-status">{message}</p>
        <div
          className="loader-track"
          role="progressbar"
          aria-label={message}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="loader-fill loader-indeterminate" />
        </div>
        <p className="loader-hint">{hint}</p>
      </div>
    </div>
  </div>
);

export default PageLoader;
