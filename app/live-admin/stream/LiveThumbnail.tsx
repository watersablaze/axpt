export default function LiveThumbnail({ src }: { src: string }) {
  return (
    <div className="liveThumbnail">
      <h3>Live Preview</h3>
      <img src={src} alt="Live stream thumbnail" />
    </div>
  );
}