export function isValidVueComponent(content) {
    return content.includes('<template>') && content.includes('<script>') && content.includes('<style');
}