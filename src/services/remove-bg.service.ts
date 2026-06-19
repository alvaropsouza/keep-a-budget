import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class RemoveBgService {
  private readonly logger = new Logger(RemoveBgService.name);

  async removeBackground(buffer: Buffer, mimeType: string): Promise<string | null> {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) return null;

    try {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType });
      formData.append("image_file", blob, "photo");
      formData.append("size", "small");

      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: formData,
      });

      if (!res.ok) {
        this.logger.warn(`remove.bg returned ${res.status}`);
        return null;
      }

      const resultBuffer = Buffer.from(await res.arrayBuffer());
      return `data:image/png;base64,${resultBuffer.toString("base64")}`;
    } catch (err) {
      this.logger.warn("remove.bg failed", err);
      return null;
    }
  }
}
