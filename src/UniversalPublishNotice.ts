import { Notice } from "obsidian";

export class UniversalPublishNotice extends Notice {
	constructor(message: string | DocumentFragment, timeout?: number) {
		super(`Universal Publish: ${message}`, timeout)
	}

	setMessage(message: string | DocumentFragment): this {
		return super.setMessage(`Universal Publish: ${message}`)
	}
}
