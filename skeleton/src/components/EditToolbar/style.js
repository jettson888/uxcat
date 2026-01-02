const styles = `
.wrap {
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 999999;
  pointer-events: none;
}
.tools-box {
  display: flex; 
  pointer-events: auto;
  position: absolute;
}
.item-icon {
  width: 20px !important;
  height: 20px !important;
  background-color: #078BFA;
  color: white !important;
  cursor: pointer;
  margin-left: 2px;
}
.item-icon:first-child {
  margin-left: 0px !important;
}
.mark-line {
  border: 2px dashed #078bfa;
  background: transparent;
  box-sizing: border-box;
}
`

export default styles
